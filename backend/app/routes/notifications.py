"""
Notifications Routes
====================
POST /notifications/send       — Send a notification
GET  /notifications            — List user notifications
PUT  /notifications/{id}/read  — Mark notification as read
DELETE /notifications/{id}     — Delete notification
DELETE /notifications          — Clear all notifications
POST /notifications/settings   — Update notification preferences
GET  /notifications/settings   — Get notification preferences
"""

import logging
import math
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_database, is_db_connected, NOTIFICATIONS_COLLECTION, USERS_COLLECTION
from app.routes.auth import get_current_user
from app.db_models import PaginatedResponse
from app.utils.email_service import send_disease_alert

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["Notifications"])


def serialize_notification(doc: dict) -> dict:
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    for field in ("created_at", "read_at"):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    return doc


@router.post("/send")
async def send_notification(
    user_id: str,
    title: str,
    message: str,
    notification_type: str = "info",
    send_email: bool = False,
    current_user: dict = Depends(get_current_user),
):
    """Send a notification to a user (admin or self)."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    notif_doc = {
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": notification_type,
        "read": False,
        "read_at": None,
        "created_at": datetime.now(timezone.utc),
    }

    result = await db[NOTIFICATIONS_COLLECTION].insert_one(notif_doc)
    notif_doc["id"] = str(result.inserted_id)

    if send_email:
        user = await db[USERS_COLLECTION].find_one({"_id": ObjectId(user_id)})
        if user and user.get("email"):
            from app.utils.email_service import send_email as send
            send(user["email"], title, f"<h3>{title}</h3><p>{message}</p>")

    return serialize_notification(notif_doc)


@router.get("", response_model=PaginatedResponse)
async def list_notifications(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: dict = Depends(get_current_user),
):
    """List notifications for the current user."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    user_id = str(current_user["_id"])
    query = {"user_id": user_id}
    if unread_only:
        query["read"] = False

    total = await db[NOTIFICATIONS_COLLECTION].count_documents(query)
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    skip = (page - 1) * per_page

    cursor = db[NOTIFICATIONS_COLLECTION].find(query).sort("created_at", -1).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        items.append(serialize_notification(doc))

    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page, total_pages=total_pages)


@router.put("/{notification_id}/read")
async def mark_as_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Mark a notification as read."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(notification_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid notification ID")

    result = await db[NOTIFICATIONS_COLLECTION].update_one(
        {"_id": oid, "user_id": str(current_user["_id"])},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc)}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"message": "Notification marked as read"}


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a notification."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(notification_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid notification ID")

    result = await db[NOTIFICATIONS_COLLECTION].delete_one(
        {"_id": oid, "user_id": str(current_user["_id"])}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"message": "Notification deleted"}


@router.delete("")
async def clear_notifications(current_user: dict = Depends(get_current_user)):
    """Clear all notifications for the current user."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    result = await db[NOTIFICATIONS_COLLECTION].delete_many({"user_id": str(current_user["_id"])})
    return {"message": "All notifications cleared", "deleted_count": result.deleted_count}


@router.get("/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Get the count of unread notifications."""
    db = get_database()
    if db is None:
        return {"unread_count": 0}

    count = await db[NOTIFICATIONS_COLLECTION].count_documents({
        "user_id": str(current_user["_id"]),
        "read": False,
    })
    return {"unread_count": count}
