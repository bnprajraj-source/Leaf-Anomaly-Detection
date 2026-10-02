"""
Expense / Cost Tracking Routes
==============================
POST   /expenses/log        — Record an expense
GET    /expenses            — List expenses
GET    /expenses/summary    — Expense summary by category
GET    /expenses/budget     — Budget overview
PUT    /expenses/{id}       — Update expense
DELETE /expenses/{id}       — Delete expense
"""

import logging
import math
from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_database, is_db_connected, EXPENSES_COLLECTION
from app.routes.auth import get_current_user
from app.db_models import PaginatedResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/expenses", tags=["Expense Tracking"])

EXPENSE_CATEGORIES = [
    "seeds", "soil", "fertilizer", "pesticide", "tools",
    "irrigation", "containers", "lighting", "labor", "other",
]

PAYMENT_METHODS = ["cash", "card", "bank_transfer", "upi", "other"]


def serialize_expense(doc: dict) -> dict:
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    for field in ("expense_date", "created_at"):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    return doc


@router.post("/log", status_code=201)
async def log_expense(
    amount: float,
    category: str,
    description: str,
    plant_id: Optional[str] = None,
    location_id: Optional[str] = None,
    payment_method: str = "cash",
    receipt_url: Optional[str] = None,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Record an expense."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    if category not in EXPENSE_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Use: {', '.join(EXPENSE_CATEGORIES)}")

    expense_doc = {
        "user_id": str(current_user["_id"]),
        "amount": amount,
        "category": category,
        "description": description,
        "plant_id": plant_id,
        "location_id": location_id,
        "payment_method": payment_method,
        "receipt_url": receipt_url,
        "notes": notes,
        "expense_date": datetime.now(timezone.utc),
    }

    result = await db[EXPENSES_COLLECTION].insert_one(expense_doc)
    expense_doc["_id"] = result.inserted_id
    return serialize_expense(expense_doc)


@router.get("", response_model=PaginatedResponse)
async def list_expenses(
    category: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """List expenses with filters."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    query = {"user_id": str(current_user["_id"])}
    if category:
        query["category"] = category
    if min_amount is not None:
        query.setdefault("amount", {})["$gte"] = min_amount
    if max_amount is not None:
        query.setdefault("amount", {})["$lte"] = max_amount
    if start_date:
        from app.routes.analytics import _parse_date
        query.setdefault("expense_date", {})["$gte"] = _parse_date(start_date)
    if end_date:
        from app.routes.analytics import _parse_date
        end_dt = _parse_date(end_date).replace(hour=23, minute=59, second=59)
        query.setdefault("expense_date", {})["$lte"] = end_dt

    total = await db[EXPENSES_COLLECTION].count_documents(query)
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    skip = (page - 1) * per_page

    cursor = db[EXPENSES_COLLECTION].find(query).sort("expense_date", -1).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        items.append(serialize_expense(doc))

    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page, total_pages=total_pages)


@router.get("/summary")
async def get_expense_summary(
    days: int = Query(365, ge=1, le=1825),
    current_user: dict = Depends(get_current_user),
):
    """Get expense summary by category."""
    db = get_database()
    if db is None:
        return {"summary": {}, "db_connected": False}

    user_id = str(current_user["_id"])
    start = datetime.now(timezone.utc) - timedelta(days=days)

    pipeline = [
        {"$match": {"user_id": user_id, "expense_date": {"$gte": start}}},
        {
            "$group": {
                "_id": "$category",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1},
                "avg": {"$avg": "$amount"},
            }
        },
        {"$sort": {"total": -1}},
    ]
    results = await db[EXPENSES_COLLECTION].aggregate(pipeline).to_list(20)

    categories = []
    grand_total = 0
    for r in results:
        categories.append({
            "category": r["_id"],
            "total": round(r["total"], 2),
            "count": r["count"],
            "average": round(r["avg"], 2),
        })
        grand_total += r["total"]

    return {
        "days": days,
        "grand_total": round(grand_total, 2),
        "categories": categories,
        "db_connected": True,
    }


@router.get("/budget")
async def get_budget_overview(
    monthly_budget: Optional[float] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """Get current month's spending vs budget."""
    db = get_database()
    if db is None:
        return {"budget": {}, "db_connected": False}

    user_id = str(current_user["_id"])
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    pipeline = [
        {"$match": {"user_id": user_id, "expense_date": {"$gte": month_start}}},
        {
            "$group": {
                "_id": None,
                "total_spent": {"$sum": "$amount"},
                "transaction_count": {"$sum": 1},
            }
        },
    ]
    results = await db[EXPENSES_COLLECTION].aggregate(pipeline).to_list(1)
    stats = results[0] if results else {"total_spent": 0, "transaction_count": 0}

    total_spent = stats.get("total_spent", 0)
    remaining = (monthly_budget - total_spent) if monthly_budget else None
    percent_used = round((total_spent / monthly_budget * 100), 2) if monthly_budget else None

    return {
        "month": now.strftime("%Y-%m"),
        "total_spent": round(total_spent, 2),
        "transaction_count": stats.get("transaction_count", 0),
        "monthly_budget": monthly_budget,
        "remaining": round(remaining, 2) if remaining is not None else None,
        "percent_used": percent_used,
        "db_connected": True,
    }


@router.delete("/{expense_id}")
async def delete_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an expense record."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(expense_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid expense ID")

    result = await db[EXPENSES_COLLECTION].delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")

    return {"message": "Expense deleted"}
