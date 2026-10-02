"""
Harvest Tracking Routes
=======================
POST   /harvest/log        — Record a harvest
GET    /harvest            — List harvest records
GET    /harvest/stats      — Harvest statistics
PUT    /harvest/{id}       — Update harvest
DELETE /harvest/{id}       — Delete harvest
"""

import logging
import math
from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_database, is_db_connected, HARVEST_COLLECTION, PLANTS_COLLECTION
from app.routes.auth import get_current_user
from app.db_models import PaginatedResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/harvest", tags=["Harvest Tracking"])

QUALITY_GRADES = ["excellent", "good", "average", "poor", "damaged"]
HARVEST_UNITS = ["kg", "g", "lbs", "oz", "pieces", "bunches", "liters"]


def serialize_harvest(doc: dict) -> dict:
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    for field in ("harvested_at", "created_at"):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    return doc


@router.post("/log", status_code=201)
async def log_harvest(
    plant_id: str,
    quantity: float,
    unit: str = "kg",
    quality: Optional[str] = None,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Record a harvest event for a plant."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    if unit not in HARVEST_UNITS:
        raise HTTPException(status_code=400, detail=f"Invalid unit. Use: {', '.join(HARVEST_UNITS)}")
    if quality and quality not in QUALITY_GRADES:
        raise HTTPException(status_code=400, detail=f"Invalid quality. Use: {', '.join(QUALITY_GRADES)}")

    try:
        plant_oid = ObjectId(plant_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid plant ID")

    plant = await db[PLANTS_COLLECTION].find_one({"_id": plant_oid, "user_id": str(current_user["_id"])})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    harvest_doc = {
        "user_id": str(current_user["_id"]),
        "plant_id": plant_id,
        "plant_name": plant.get("name", "Unknown"),
        "quantity": quantity,
        "unit": unit,
        "quality": quality,
        "notes": notes,
        "harvested_at": datetime.now(timezone.utc),
    }

    result = await db[HARVEST_COLLECTION].insert_one(harvest_doc)
    harvest_doc["_id"] = result.inserted_id
    return serialize_harvest(harvest_doc)


@router.get("", response_model=PaginatedResponse)
async def list_harvests(
    plant_id: Optional[str] = Query(None),
    quality: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """List harvest records with optional filters."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    query = {"user_id": str(current_user["_id"])}
    if plant_id:
        query["plant_id"] = plant_id
    if quality:
        query["quality"] = quality

    total = await db[HARVEST_COLLECTION].count_documents(query)
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    skip = (page - 1) * per_page

    cursor = db[HARVEST_COLLECTION].find(query).sort("harvested_at", -1).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        items.append(serialize_harvest(doc))

    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page, total_pages=total_pages)


@router.get("/stats")
async def get_harvest_stats(
    days: int = Query(365, ge=1, le=1825),
    current_user: dict = Depends(get_current_user),
):
    """Get harvest statistics and totals."""
    db = get_database()
    if db is None:
        return {"stats": {}, "db_connected": False}

    user_id = str(current_user["_id"])
    start = datetime.now(timezone.utc) - timedelta(days=days)

    pipeline = [
        {"$match": {"user_id": user_id, "harvested_at": {"$gte": start}}},
        {
            "$group": {
                "_id": None,
                "total_harvests": {"$sum": 1},
                "total_quantity": {"$sum": "$quantity"},
                "avg_quantity": {"$avg": "$quantity"},
                "unique_plants": {"$addToSet": "$plant_id"},
            }
        },
    ]
    results = await db[HARVEST_COLLECTION].aggregate(pipeline).to_list(1)
    stats = results[0] if results else {}

    # Per-plant breakdown
    plant_pipeline = [
        {"$match": {"user_id": user_id, "harvested_at": {"$gte": start}}},
        {"$group": {"_id": {"plant_id": "$plant_id", "plant_name": "$plant_name", "unit": "$unit"}, "total": {"$sum": "$quantity"}, "count": {"$sum": 1}}},
        {"$sort": {"total": -1}},
    ]
    plant_results = await db[HARVEST_COLLECTION].aggregate(plant_pipeline).to_list(50)
    by_plant = [
        {
            "plant_id": r["_id"]["plant_id"],
            "plant_name": r["_id"]["plant_name"],
            "unit": r["_id"]["unit"],
            "total_harvested": round(r["total"], 2),
            "harvest_count": r["count"],
        }
        for r in plant_results
    ]

    return {
        "days": days,
        "stats": {
            "total_harvests": stats.get("total_harvests", 0),
            "total_quantity": round(stats.get("total_quantity", 0), 2),
            "avg_quantity": round(stats.get("avg_quantity", 0), 2),
            "unique_plants": len(stats.get("unique_plants", [])),
        },
        "by_plant": by_plant,
        "db_connected": True,
    }


@router.delete("/{harvest_id}")
async def delete_harvest(harvest_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a harvest record."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(harvest_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid harvest ID")

    result = await db[HARVEST_COLLECTION].delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Harvest record not found")

    return {"message": "Harvest record deleted"}
