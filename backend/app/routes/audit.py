"""
Audit Log Routes
================
GET    /audit              — List audit logs
GET    /audit/stats        — Get action statistics
DELETE /audit              — Clear audit logs (admin)
"""

import logging
import math
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_database, is_db_connected, AUDIT_LOG_COLLECTION
from app.routes.auth import get_current_user
from app.db_models import PaginatedResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/audit", tags=["Audit Log"])


async def log_action(user_id: str, action: str, resource_type: str = None,
                     resource_id: str = None, details: dict = None, ip_address: str = None):
    """Log a user action to the audit trail."""
    db = get_database()
    if db is None:
        return

    log_doc = {
        "user_id": user_id,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "details": details or {},
        "ip_address": ip_address,
        "timestamp": datetime.now(timezone.utc),
    }
    try:
        await db[AUDIT_LOG_COLLECTION].insert_one(log_doc)
    except Exception as e:
        logger.warning(f"Failed to write audit log: {e}")


def serialize_log(doc: dict) -> dict:
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    if isinstance(doc.get("timestamp"), datetime):
        doc["timestamp"] = doc["timestamp"].isoformat()
    return doc


@router.get("", response_model=PaginatedResponse)
async def list_audit_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """List audit logs for the current user with optional filters."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    query = {"user_id": str(current_user["_id"])}
    if action:
        query["action"] = action
    if resource_type:
        query["resource_type"] = resource_type
    if start_date:
        from app.routes.analytics import _parse_date
        query.setdefault("timestamp", {})["$gte"] = _parse_date(start_date)
    if end_date:
        from app.routes.analytics import _parse_date
        end_dt = _parse_date(end_date).replace(hour=23, minute=59, second=59)
        query.setdefault("timestamp", {})["$lte"] = end_dt

    total = await db[AUDIT_LOG_COLLECTION].count_documents(query)
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    skip = (page - 1) * per_page

    cursor = db[AUDIT_LOG_COLLECTION].find(query).sort("timestamp", -1).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        items.append(serialize_log(doc))

    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page, total_pages=total_pages)


@router.get("/stats")
async def get_audit_stats(
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
):
    """Get action statistics for the user."""
    db = get_database()
    if db is None:
        return {"actions": {}, "total": 0}

    from datetime import timedelta
    start = datetime.now(timezone.utc) - timedelta(days=days)
    user_id = str(current_user["_id"])

    pipeline = [
        {"$match": {"user_id": user_id, "timestamp": {"$gte": start}}},
        {"$group": {"_id": "$action", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    results = await db[AUDIT_LOG_COLLECTION].aggregate(pipeline).to_list(50)
    actions = {r["_id"]: r["count"] for r in results}
    total = sum(actions.values())

    return {"days": days, "actions": actions, "total": total}


@router.delete("")
async def clear_audit_logs(current_user: dict = Depends(get_current_user)):
    """Clear all audit logs for the current user."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    result = await db[AUDIT_LOG_COLLECTION].delete_many({"user_id": str(current_user["_id"])})
    return {"message": "Audit logs cleared", "deleted_count": result.deleted_count}
