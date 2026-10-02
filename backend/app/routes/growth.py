"""
Growth Stage Tracking Routes
============================
POST   /growth/stages           — Record a growth stage
GET    /growth/stages           — List growth stages for a plant
GET    /growth/stages/{id}      — Get stage details
PUT    /growth/stages/{id}      — Update stage
DELETE /growth/stages/{id}      — Delete stage
GET    /growth/stages/{plant_id}/timeline — Get full growth timeline
GET    /growth/current/{plant_id} — Get current growth stage
"""

import logging
import math
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_database, is_db_connected, GROWTH_STAGES_COLLECTION, PLANTS_COLLECTION
from app.routes.auth import get_current_user
from app.db_models import PaginatedResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/growth", tags=["Growth Stage Tracking"])

GROWTH_STAGE_TYPES = [
    "seed", "seedling", "vegetative", "budding",
    "flowering", "fruiting", "ripening", "dormant", "harvested",
]

def serialize_stage(doc: dict) -> dict:
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    for field in ("recorded_at", "start_date", "end_date"):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    return doc


@router.post("/stages", status_code=201)
async def record_growth_stage(
    plant_id: str,
    stage: str,
    height_cm: Optional[float] = None,
    leaf_count: Optional[int] = None,
    notes: Optional[str] = None,
    photo_url: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Record a new growth stage for a plant."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    if stage not in GROWTH_STAGE_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid stage. Use: {', '.join(GROWTH_STAGE_TYPES)}")

    try:
        plant_oid = ObjectId(plant_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid plant ID")

    plant = await db[PLANTS_COLLECTION].find_one({"_id": plant_oid, "user_id": str(current_user["_id"])})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    stage_doc = {
        "user_id": str(current_user["_id"]),
        "plant_id": plant_id,
        "plant_name": plant.get("name", "Unknown"),
        "stage": stage,
        "height_cm": height_cm,
        "leaf_count": leaf_count,
        "notes": notes,
        "photo_url": photo_url,
        "recorded_at": datetime.now(timezone.utc),
    }

    result = await db[GROWTH_STAGES_COLLECTION].insert_one(stage_doc)
    stage_doc["_id"] = result.inserted_id

    # Update plant's current stage
    await db[PLANTS_COLLECTION].update_one(
        {"_id": plant_oid},
        {"$set": {"current_growth_stage": stage, "updated_at": datetime.now(timezone.utc)}}
    )

    return serialize_stage(stage_doc)


@router.get("/stages", response_model=PaginatedResponse)
async def list_growth_stages(
    plant_id: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """List growth stages with optional filters."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    query = {"user_id": str(current_user["_id"])}
    if plant_id:
        query["plant_id"] = plant_id
    if stage:
        query["stage"] = stage

    total = await db[GROWTH_STAGES_COLLECTION].count_documents(query)
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    skip = (page - 1) * per_page

    cursor = db[GROWTH_STAGES_COLLECTION].find(query).sort("recorded_at", -1).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        items.append(serialize_stage(doc))

    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page, total_pages=total_pages)


@router.get("/stages/{stage_id}")
async def get_growth_stage(stage_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed growth stage information."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(stage_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid stage ID")

    stage = await db[GROWTH_STAGES_COLLECTION].find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not stage:
        raise HTTPException(status_code=404, detail="Growth stage not found")

    return serialize_stage(stage)


@router.put("/stages/{stage_id}")
async def update_growth_stage(
    stage_id: str,
    stage: Optional[str] = None,
    height_cm: Optional[float] = None,
    leaf_count: Optional[int] = None,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Update a growth stage record."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(stage_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid stage ID")

    update_fields = {}
    if stage is not None:
        if stage not in GROWTH_STAGE_TYPES:
            raise HTTPException(status_code=400, detail=f"Invalid stage. Use: {', '.join(GROWTH_STAGE_TYPES)}")
        update_fields["stage"] = stage
    if height_cm is not None:
        update_fields["height_cm"] = height_cm
    if leaf_count is not None:
        update_fields["leaf_count"] = leaf_count
    if notes is not None:
        update_fields["notes"] = notes

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db[GROWTH_STAGES_COLLECTION].update_one(
        {"_id": oid, "user_id": str(current_user["_id"])},
        {"$set": update_fields}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Growth stage not found")

    updated = await db[GROWTH_STAGES_COLLECTION].find_one({"_id": oid})
    return serialize_stage(updated)


@router.delete("/stages/{stage_id}")
async def delete_growth_stage(stage_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a growth stage record."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(stage_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid stage ID")

    result = await db[GROWTH_STAGES_COLLECTION].delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Growth stage not found")

    return {"message": "Growth stage deleted"}


@router.get("/timeline/{plant_id}")
async def get_growth_timeline(plant_id: str, current_user: dict = Depends(get_current_user)):
    """Get the full growth timeline for a plant."""
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

    cursor = db[GROWTH_STAGES_COLLECTION].find({"plant_id": plant_id}).sort("recorded_at", 1)
    stages = []
    async for doc in cursor:
        stages.append(serialize_stage(doc))

    # Compute stage durations
    durations = {}
    for i, s in enumerate(stages):
        if i < len(stages) - 1:
            start = datetime.fromisoformat(s["recorded_at"]) if isinstance(s["recorded_at"], str) else s["recorded_at"]
            end = datetime.fromisoformat(stages[i + 1]["recorded_at"]) if isinstance(stages[i + 1]["recorded_at"], str) else stages[i + 1]["recorded_at"]
            days = (end - start).days
            durations[s["stage"]] = days

    return {
        "plant_id": plant_id,
        "plant_name": plant.get("name"),
        "current_stage": plant.get("current_growth_stage"),
        "total_stages": len(stages),
        "stages": stages,
        "durations_days": durations,
    }


@router.get("/current/{plant_id}")
async def get_current_stage(plant_id: str, current_user: dict = Depends(get_current_user)):
    """Get the current growth stage for a plant."""
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

    # Get latest stage
    cursor = db[GROWTH_STAGES_COLLECTION].find({"plant_id": plant_id}).sort("recorded_at", -1).limit(1)
    stages = []
    async for doc in cursor:
        stages.append(serialize_stage(doc))

    latest = stages[0] if stages else None

    return {
        "plant_id": plant_id,
        "plant_name": plant.get("name"),
        "current_stage": plant.get("current_growth_stage", "unknown"),
        "latest_record": latest,
    }


@router.get("/available-stages")
async def get_available_stages():
    """List all available growth stage types."""
    return {"stages": GROWTH_STAGE_TYPES}
