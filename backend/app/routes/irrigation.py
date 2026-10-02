"""
Irrigation / Watering Logs Routes
==================================
POST   /irrigation/log          — Record a watering event
GET    /irrigation              — List watering logs
GET    /irrigation/schedule     — Get watering schedule
PUT    /irrigation/{id}         — Update watering record
DELETE /irrigation/{id}         — Delete watering record
GET    /irrigation/stats        — Watering statistics
POST   /irrigation/schedule/set — Set watering schedule for a plant
"""

import logging
import math
from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_database, is_db_connected, IRRIGATION_COLLECTION, PLANTS_COLLECTION
from app.routes.auth import get_current_user
from app.db_models import PaginatedResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/irrigation", tags=["Irrigation & Watering"])

WATER_METHODS = ["manual", "drip", "sprinkler", "soaker", "flood", "mist"]


def serialize_irrigation(doc: dict) -> dict:
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    for field in ("watered_at", "created_at", "next_scheduled"):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    return doc


@router.post("/log", status_code=201)
async def log_watering(
    plant_id: str,
    amount_ml: Optional[float] = None,
    method: str = "manual",
    duration_seconds: Optional[int] = None,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Record a watering event for a plant."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    if method not in WATER_METHODS:
        raise HTTPException(status_code=400, detail=f"Invalid method. Use: {', '.join(WATER_METHODS)}")

    try:
        plant_oid = ObjectId(plant_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid plant ID")

    plant = await db[PLANTS_COLLECTION].find_one({"_id": plant_oid, "user_id": str(current_user["_id"])})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    irrigation_doc = {
        "user_id": str(current_user["_id"]),
        "plant_id": plant_id,
        "plant_name": plant.get("name", "Unknown"),
        "amount_ml": amount_ml,
        "method": method,
        "duration_seconds": duration_seconds,
        "notes": notes,
        "watered_at": datetime.now(timezone.utc),
    }

    result = await db[IRRIGATION_COLLECTION].insert_one(irrigation_doc)
    irrigation_doc["_id"] = result.inserted_id

    # Update plant's last watered
    await db[PLANTS_COLLECTION].update_one(
        {"_id": plant_oid},
        {"$set": {"last_watered": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)}}
    )

    return serialize_irrigation(irrigation_doc)


@router.get("", response_model=PaginatedResponse)
async def list_irrigation_logs(
    plant_id: Optional[str] = Query(None),
    method: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """List watering logs with optional filters."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    query = {"user_id": str(current_user["_id"])}
    if plant_id:
        query["plant_id"] = plant_id
    if method:
        query["method"] = method

    total = await db[IRRIGATION_COLLECTION].count_documents(query)
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    skip = (page - 1) * per_page

    cursor = db[IRRIGATION_COLLECTION].find(query).sort("watered_at", -1).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        items.append(serialize_irrigation(doc))

    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page, total_pages=total_pages)


@router.get("/schedule")
async def get_watering_schedule(current_user: dict = Depends(get_current_user)):
    """Get upcoming watering schedule for all plants."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    user_id = str(current_user["_id"])

    # Get plants with watering schedules
    cursor = db[PLANTS_COLLECTION].find({
        "user_id": user_id,
        "watering_schedule": {"$ne": None}
    })

    schedule = []
    async for plant in cursor:
        plant_id = str(plant["_id"])
        schedule_config = plant.get("watering_schedule", {})

        if not schedule_config:
            continue

        interval_days = schedule_config.get("interval_days", 1)
        last_watered = plant.get("last_watered")

        if last_watered:
            next_water = last_watered + timedelta(days=interval_days)
        else:
            next_water = datetime.now(timezone.utc) + timedelta(days=interval_days)

        schedule.append({
            "plant_id": plant_id,
            "plant_name": plant.get("name", "Unknown"),
            "interval_days": interval_days,
            "amount_ml": schedule_config.get("amount_ml"),
            "method": schedule_config.get("method", "manual"),
            "last_watered": last_watered.isoformat() if isinstance(last_watered, datetime) else None,
            "next_scheduled": next_water.isoformat(),
            "is_overdue": next_water < datetime.now(timezone.utc),
        })

    # Sort by next scheduled
    schedule.sort(key=lambda x: x["next_scheduled"])

    return {"schedule": schedule, "total_plants": len(schedule)}


@router.post("/schedule/set")
async def set_watering_schedule(
    plant_id: str,
    interval_days: int,
    amount_ml: Optional[float] = None,
    method: str = "manual",
    current_user: dict = Depends(get_current_user),
):
    """Set a recurring watering schedule for a plant."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        plant_oid = ObjectId(plant_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid plant ID")

    plant = await db[PLANTS_COLLECTION].find_one({"_id": plant_oid, "user_id": str(current_user["_id"])})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    schedule_config = {
        "interval_days": interval_days,
        "amount_ml": amount_ml,
        "method": method,
    }

    await db[PLANTS_COLLECTION].update_one(
        {"_id": plant_oid},
        {"$set": {"watering_schedule": schedule_config, "updated_at": datetime.now(timezone.utc)}}
    )

    return {"message": "Watering schedule set", "plant_id": plant_id, "schedule": schedule_config}


@router.put("/{irrigation_id}")
async def update_irrigation(
    irrigation_id: str,
    amount_ml: Optional[float] = None,
    method: Optional[str] = None,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Update a watering record."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(irrigation_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid irrigation ID")

    update_fields = {}
    if amount_ml is not None:
        update_fields["amount_ml"] = amount_ml
    if method is not None:
        if method not in WATER_METHODS:
            raise HTTPException(status_code=400, detail=f"Invalid method. Use: {', '.join(WATER_METHODS)}")
        update_fields["method"] = method
    if notes is not None:
        update_fields["notes"] = notes

    result = await db[IRRIGATION_COLLECTION].update_one(
        {"_id": oid, "user_id": str(current_user["_id"])},
        {"$set": update_fields}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Irrigation record not found")

    updated = await db[IRRIGATION_COLLECTION].find_one({"_id": oid})
    return serialize_irrigation(updated)


@router.delete("/{irrigation_id}")
async def delete_irrigation(irrigation_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a watering record."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(irrigation_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid irrigation ID")

    result = await db[IRRIGATION_COLLECTION].delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Irrigation record not found")

    return {"message": "Watering record deleted"}


@router.get("/stats")
async def get_irrigation_stats(
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
):
    """Get watering statistics for a time period."""
    db = get_database()
    if db is None:
        return {"stats": {}, "db_connected": False}

    user_id = str(current_user["_id"])
    start = datetime.now(timezone.utc) - timedelta(days=days)

    pipeline = [
        {"$match": {"user_id": user_id, "watered_at": {"$gte": start}}},
        {
            "$group": {
                "_id": None,
                "total_waterings": {"$sum": 1},
                "total_water_ml": {"$sum": "$amount_ml"},
                "avg_water_ml": {"$avg": "$amount_ml"},
                "unique_plants": {"$addToSet": "$plant_id"},
            }
        },
    ]
    results = await db[IRRIGATION_COLLECTION].aggregate(pipeline).to_list(1)
    stats = results[0] if results else {}

    # Per-method breakdown
    method_pipeline = [
        {"$match": {"user_id": user_id, "watered_at": {"$gte": start}}},
        {"$group": {"_id": "$method", "count": {"$sum": 1}}},
    ]
    method_results = await db[IRRIGATION_COLLECTION].aggregate(method_pipeline).to_list(10)
    methods = {r["_id"]: r["count"] for r in method_results}

    return {
        "days": days,
        "stats": {
            "total_waterings": stats.get("total_waterings", 0),
            "total_water_ml": round(stats.get("total_water_ml", 0), 1),
            "avg_water_ml": round(stats.get("avg_water_ml", 0), 1),
            "unique_plants": len(stats.get("unique_plants", [])),
        },
        "methods": methods,
        "db_connected": True,
    }
