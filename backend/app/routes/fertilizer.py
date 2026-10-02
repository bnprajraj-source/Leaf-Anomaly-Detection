"""
Fertilizer Tracking Routes
==========================
POST   /fertilizer/log        — Record fertilizer application
GET    /fertilizer            — List fertilizer logs
GET    /fertilizer/schedule   — Get fertilizer schedule
PUT    /fertilizer/{id}       — Update record
DELETE /fertilizer/{id}       — Delete record
GET    /fertilizer/stats      — Fertilizer statistics
"""

import logging
import math
from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_database, is_db_connected, FERTILIZER_COLLECTION, PLANTS_COLLECTION
from app.routes.auth import get_current_user
from app.db_models import PaginatedResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/fertilizer", tags=["Fertilizer Tracking"])

FERTILIZER_TYPES = ["organic", "synthetic", "slow_release", "liquid", "granular", "bone_meal", "compost", "manure", "other"]
NUTRIENT_UNITS = ["npk", "percent", "ppm", "g_per_liter", "ml_per_liter"]


def serialize_fertilizer(doc: dict) -> dict:
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    for field in ("applied_at", "created_at"):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    return doc


@router.post("/log", status_code=201)
async def log_fertilizer(
    plant_id: str,
    fertilizer_type: str,
    product_name: Optional[str] = None,
    npk_ratio: Optional[str] = None,
    amount_grams: Optional[float] = None,
    amount_ml: Optional[float] = None,
    diluted: bool = False,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Record a fertilizer application for a plant."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    if fertilizer_type not in FERTILIZER_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid type. Use: {', '.join(FERTILIZER_TYPES)}")

    try:
        plant_oid = ObjectId(plant_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid plant ID")

    plant = await db[PLANTS_COLLECTION].find_one({"_id": plant_oid, "user_id": str(current_user["_id"])})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    fert_doc = {
        "user_id": str(current_user["_id"]),
        "plant_id": plant_id,
        "plant_name": plant.get("name", "Unknown"),
        "fertilizer_type": fertilizer_type,
        "product_name": product_name,
        "npk_ratio": npk_ratio,
        "amount_grams": amount_grams,
        "amount_ml": amount_ml,
        "diluted": diluted,
        "notes": notes,
        "applied_at": datetime.now(timezone.utc),
    }

    result = await db[FERTILIZER_COLLECTION].insert_one(fert_doc)
    fert_doc["_id"] = result.inserted_id
    return serialize_fertilizer(fert_doc)


@router.get("", response_model=PaginatedResponse)
async def list_fertilizer_logs(
    plant_id: Optional[str] = Query(None),
    fertilizer_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """List fertilizer logs with optional filters."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    query = {"user_id": str(current_user["_id"])}
    if plant_id:
        query["plant_id"] = plant_id
    if fertilizer_type:
        query["fertilizer_type"] = fertilizer_type

    total = await db[FERTILIZER_COLLECTION].count_documents(query)
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    skip = (page - 1) * per_page

    cursor = db[FERTILIZER_COLLECTION].find(query).sort("applied_at", -1).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        items.append(serialize_fertilizer(doc))

    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page, total_pages=total_pages)


@router.get("/schedule")
async def get_fertilizer_schedule(current_user: dict = Depends(get_current_user)):
    """Get upcoming fertilizer schedule for all plants."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    user_id = str(current_user["_id"])
    cursor = db[PLANTS_COLLECTION].find({
        "user_id": user_id,
        "fertilizer_schedule": {"$ne": None}
    })

    schedule = []
    async for plant in cursor:
        sched = plant.get("fertilizer_schedule", {})
        if not sched:
            continue

        interval_days = sched.get("interval_days", 14)
        last_applied = plant.get("last_fertilized")

        if last_applied:
            next_date = last_applied + timedelta(days=interval_days)
        else:
            next_date = datetime.now(timezone.utc) + timedelta(days=interval_days)

        schedule.append({
            "plant_id": str(plant["_id"]),
            "plant_name": plant.get("name"),
            "interval_days": interval_days,
            "fertilizer_type": sched.get("fertilizer_type"),
            "npk_ratio": sched.get("npk_ratio"),
            "last_applied": last_applied.isoformat() if isinstance(last_applied, datetime) else None,
            "next_scheduled": next_date.isoformat(),
            "is_overdue": next_date < datetime.now(timezone.utc),
        })

    schedule.sort(key=lambda x: x["next_scheduled"])
    return {"schedule": schedule, "total_plants": len(schedule)}


@router.put("/{fert_id}")
async def update_fertilizer(
    fert_id: str,
    fertilizer_type: Optional[str] = None,
    product_name: Optional[str] = None,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Update a fertilizer record."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(fert_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid fertilizer ID")

    update_fields = {}
    if fertilizer_type is not None:
        if fertilizer_type not in FERTILIZER_TYPES:
            raise HTTPException(status_code=400, detail=f"Invalid type. Use: {', '.join(FERTILIZER_TYPES)}")
        update_fields["fertilizer_type"] = fertilizer_type
    if product_name is not None:
        update_fields["product_name"] = product_name
    if notes is not None:
        update_fields["notes"] = notes

    result = await db[FERTILIZER_COLLECTION].update_one(
        {"_id": oid, "user_id": str(current_user["_id"])},
        {"$set": update_fields}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Fertilizer record not found")

    updated = await db[FERTILIZER_COLLECTION].find_one({"_id": oid})
    return serialize_fertilizer(updated)


@router.delete("/{fert_id}")
async def delete_fertilizer(fert_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a fertilizer record."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(fert_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid fertilizer ID")

    result = await db[FERTILIZER_COLLECTION].delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fertilizer record not found")

    return {"message": "Fertilizer record deleted"}


@router.get("/stats")
async def get_fertilizer_stats(
    days: int = Query(90, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
):
    """Get fertilizer usage statistics."""
    db = get_database()
    if db is None:
        return {"stats": {}, "db_connected": False}

    user_id = str(current_user["_id"])
    start = datetime.now(timezone.utc) - timedelta(days=days)

    pipeline = [
        {"$match": {"user_id": user_id, "applied_at": {"$gte": start}}},
        {
            "$group": {
                "_id": None,
                "total_applications": {"$sum": 1},
                "total_grams": {"$sum": "$amount_grams"},
                "unique_plants": {"$addToSet": "$plant_id"},
            }
        },
    ]
    results = await db[FERTILIZER_COLLECTION].aggregate(pipeline).to_list(1)
    stats = results[0] if results else {}

    type_pipeline = [
        {"$match": {"user_id": user_id, "applied_at": {"$gte": start}}},
        {"$group": {"_id": "$fertilizer_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    type_results = await db[FERTILIZER_COLLECTION].aggregate(type_pipeline).to_list(20)
    types = {r["_id"]: r["count"] for r in type_results}

    return {
        "days": days,
        "stats": {
            "total_applications": stats.get("total_applications", 0),
            "total_grams": round(stats.get("total_grams", 0), 1),
            "unique_plants": len(stats.get("unique_plants", [])),
        },
        "by_type": types,
        "db_connected": True,
    }
