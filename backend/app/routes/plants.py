"""
Plant Health Tracking Routes
============================
POST   /plants              — Register a new plant
GET    /plants              — List all user plants
GET    /plants/{id}         — Get plant details with health history
PUT    /plants/{id}         — Update plant info
DELETE /plants/{id}         — Delete a plant
GET    /plants/{id}/history — Get full health history for a plant
POST   /plants/{id}/scan    — Record a scan result for a plant
GET    /plants/{id}/stats   — Get plant health statistics
"""

import logging
import math
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_database, is_db_connected, PLANTS_COLLECTION, PREDICTIONS_COLLECTION
from app.routes.auth import get_current_user
from app.db_models import PaginatedResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/plants", tags=["Plant Tracking"])


def serialize_plant(doc: dict) -> dict:
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    for field in ("created_at", "updated_at", "last_scanned"):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    return doc


@router.post("", status_code=201)
async def register_plant(
    name: str,
    species: Optional[str] = None,
    location_id: Optional[str] = None,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Register a new plant for tracking."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    plant_doc = {
        "user_id": str(current_user["_id"]),
        "name": name,
        "species": species,
        "location_id": location_id,
        "notes": notes,
        "health_status": "unknown",
        "last_disease": None,
        "scan_count": 0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "last_scanned": None,
    }

    result = await db[PLANTS_COLLECTION].insert_one(plant_doc)
    plant_doc["_id"] = result.inserted_id
    logger.info(f"Plant registered: {name} by {current_user['email']}")
    return serialize_plant(plant_doc)


@router.get("", response_model=PaginatedResponse)
async def list_plants(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    health_status: Optional[str] = Query(None),
    location_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """List all plants for the current user with optional filters."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    query = {"user_id": str(current_user["_id"])}
    if health_status:
        query["health_status"] = health_status
    if location_id:
        query["location_id"] = location_id
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    total = await db[PLANTS_COLLECTION].count_documents(query)
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    skip = (page - 1) * per_page

    cursor = db[PLANTS_COLLECTION].find(query).sort("updated_at", -1).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        items.append(serialize_plant(doc))

    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page, total_pages=total_pages)


@router.get("/{plant_id}")
async def get_plant(plant_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed plant information including recent health history."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(plant_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid plant ID")

    plant = await db[PLANTS_COLLECTION].find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    # Get recent scans
    cursor = db[PREDICTIONS_COLLECTION].find({
        "plant_id": plant_id,
    }).sort("created_at", -1).limit(10)

    scans = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        if isinstance(doc.get("created_at"), datetime):
            doc["created_at"] = doc["created_at"].isoformat()
        scans.append(doc)

    result = serialize_plant(plant)
    result["recent_scans"] = scans
    return result


@router.put("/{plant_id}")
async def update_plant(
    plant_id: str,
    name: Optional[str] = None,
    species: Optional[str] = None,
    location_id: Optional[str] = None,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Update plant information."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(plant_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid plant ID")

    update_fields = {"updated_at": datetime.now(timezone.utc)}
    if name is not None:
        update_fields["name"] = name
    if species is not None:
        update_fields["species"] = species
    if location_id is not None:
        update_fields["location_id"] = location_id
    if notes is not None:
        update_fields["notes"] = notes

    result = await db[PLANTS_COLLECTION].update_one(
        {"_id": oid, "user_id": str(current_user["_id"])},
        {"$set": update_fields}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Plant not found")

    plant = await db[PLANTS_COLLECTION].find_one({"_id": oid})
    return serialize_plant(plant)


@router.delete("/{plant_id}")
async def delete_plant(plant_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a plant and its associated scan history."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(plant_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid plant ID")

    result = await db[PLANTS_COLLECTION].delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plant not found")

    # Also delete associated predictions
    await db[PREDICTIONS_COLLECTION].delete_many({"plant_id": plant_id})

    return {"message": "Plant deleted"}


@router.post("/{plant_id}/scan")
async def record_scan(
    plant_id: str,
    prediction_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Link a prediction scan to a plant and update its health status."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        plant_oid = ObjectId(plant_id)
        pred_oid = ObjectId(prediction_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    plant = await db[PLANTS_COLLECTION].find_one({"_id": plant_oid, "user_id": str(current_user["_id"])})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    prediction = await db[PREDICTIONS_COLLECTION].find_one({"_id": pred_oid})
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    # Update prediction with plant_id
    await db[PREDICTIONS_COLLECTION].update_one(
        {"_id": pred_oid},
        {"$set": {"plant_id": plant_id}}
    )

    # Update plant health status
    health_status = "healthy" if prediction["prediction"] == "Healthy" else "diseased"
    await db[PLANTS_COLLECTION].update_one(
        {"_id": plant_oid},
        {
            "$set": {
                "health_status": health_status,
                "last_disease": prediction.get("anomaly_type") if health_status == "diseased" else None,
                "last_scanned": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            },
            "$inc": {"scan_count": 1},
        }
    )

    return {"message": "Scan recorded", "plant_id": plant_id, "health_status": health_status}


@router.get("/{plant_id}/history")
async def get_plant_history(
    plant_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """Get full scan history for a specific plant."""
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

    query = {"plant_id": plant_id}
    total = await db[PREDICTIONS_COLLECTION].count_documents(query)
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    skip = (page - 1) * per_page

    cursor = db[PREDICTIONS_COLLECTION].find(query).sort("created_at", -1).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        if isinstance(doc.get("created_at"), datetime):
            doc["created_at"] = doc["created_at"].isoformat()
        items.append(doc)

    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page, total_pages=total_pages)


@router.get("/{plant_id}/stats")
async def get_plant_stats(plant_id: str, current_user: dict = Depends(get_current_user)):
    """Get health statistics for a specific plant."""
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

    pipeline = [
        {"$match": {"plant_id": plant_id}},
        {
            "$group": {
                "_id": None,
                "total_scans": {"$sum": 1},
                "healthy_count": {"$sum": {"$cond": [{"$eq": ["$prediction", "Healthy"]}, 1, 0]}},
                "diseased_count": {"$sum": {"$cond": [{"$eq": ["$prediction", "Diseased"]}, 1, 0]}},
                "avg_confidence": {"$avg": "$confidence"},
                "first_scan": {"$min": "$created_at"},
                "last_scan": {"$max": "$created_at"},
            }
        },
    ]
    result = await db[PREDICTIONS_COLLECTION].aggregate(pipeline).to_list(1)
    stats = result[0] if result else {}

    disease_pipeline = [
        {"$match": {"plant_id": plant_id, "prediction": "Diseased"}},
        {"$group": {"_id": "$anomaly_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    disease_docs = await db[PREDICTIONS_COLLECTION].aggregate(disease_pipeline).to_list(50)
    disease_history = {doc["_id"]: doc["count"] for doc in disease_docs}

    return {
        "plant_id": plant_id,
        "plant_name": plant.get("name"),
        "current_health": plant.get("health_status"),
        "total_scans": stats.get("total_scans", 0),
        "healthy_count": stats.get("healthy_count", 0),
        "diseased_count": stats.get("diseased_count", 0),
        "avg_confidence": round(stats.get("avg_confidence", 0), 2),
        "disease_history": disease_history,
        "first_scan": stats["first_scan"].isoformat() if isinstance(stats.get("first_scan"), datetime) else None,
        "last_scan": stats["last_scan"].isoformat() if isinstance(stats.get("last_scan"), datetime) else None,
    }
