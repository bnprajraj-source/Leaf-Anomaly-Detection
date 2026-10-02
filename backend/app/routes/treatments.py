"""
Treatment Tracking Routes
=========================
POST   /treatments              — Record a new treatment
GET    /treatments              — List all treatments
GET    /treatments/{id}         — Get treatment details
PUT    /treatments/{id}         — Update treatment status
DELETE /treatments/{id}         — Delete treatment
GET    /treatments/{id}/progress — Get treatment progress over time
GET    /treatments/active       — Get all active treatments
"""

import logging
import math
from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_database, is_db_connected, TREATMENTS_COLLECTION, PLANTS_COLLECTION
from app.routes.auth import get_current_user
from app.db_models import PaginatedResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/treatments", tags=["Treatment Tracking"])


def serialize_treatment(doc: dict) -> dict:
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    for field in ("created_at", "updated_at", "start_date", "end_date", "next_application"):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    return doc


TREATMENT_TYPES = [
    "fungicide",
    "bactericide",
    "insecticide",
    "organic_spray",
    "neem_oil",
    "copper_spray",
    "sulfur_spray",
    "biological_control",
    "cultural_practice",
    "pruning",
    "other",
]

TREATMENT_STATUSES = ["planned", "in_progress", "completed", "paused", "cancelled"]


@router.post("", status_code=201)
async def record_treatment(
    plant_id: str,
    disease_name: str,
    treatment_type: str,
    product_name: Optional[str] = None,
    dosage: Optional[str] = None,
    notes: Optional[str] = None,
    start_date: Optional[str] = None,
    frequency_days: Optional[int] = None,
    total_applications: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    """Record a new treatment for a plant disease."""
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

    start = datetime.now(timezone.utc)
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    next_app = None
    if frequency_days:
        next_app = start + timedelta(days=frequency_days)

    treatment_doc = {
        "user_id": str(current_user["_id"]),
        "plant_id": plant_id,
        "plant_name": plant.get("name", "Unknown"),
        "disease_name": disease_name,
        "treatment_type": treatment_type,
        "product_name": product_name,
        "dosage": dosage,
        "notes": notes,
        "status": "in_progress",
        "start_date": start,
        "end_date": None,
        "next_application": next_app,
        "frequency_days": frequency_days,
        "total_applications": total_applications or 1,
        "applications_completed": 1,
        "effectiveness_rating": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = await db[TREATMENTS_COLLECTION].insert_one(treatment_doc)
    treatment_doc["_id"] = result.inserted_id
    logger.info(f"Treatment recorded for plant {plant.get('name')}: {treatment_type}")
    return serialize_treatment(treatment_doc)


@router.get("", response_model=PaginatedResponse)
async def list_treatments(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    plant_id: Optional[str] = Query(None),
    disease_name: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """List all treatments for the current user."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    query = {"user_id": str(current_user["_id"])}
    if status:
        query["status"] = status
    if plant_id:
        query["plant_id"] = plant_id
    if disease_name:
        query["disease_name"] = {"$regex": disease_name, "$options": "i"}

    total = await db[TREATMENTS_COLLECTION].count_documents(query)
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    skip = (page - 1) * per_page

    cursor = db[TREATMENTS_COLLECTION].find(query).sort("created_at", -1).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        items.append(serialize_treatment(doc))

    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page, total_pages=total_pages)


@router.get("/active")
async def get_active_treatments(current_user: dict = Depends(get_current_user)):
    """Get all treatments currently in progress."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    cursor = db[TREATMENTS_COLLECTION].find({
        "user_id": str(current_user["_id"]),
        "status": "in_progress",
    }).sort("next_application", 1)

    items = []
    async for doc in cursor:
        items.append(serialize_treatment(doc))

    return {"active_treatments": items, "count": len(items)}


@router.get("/{treatment_id}")
async def get_treatment(treatment_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed treatment information."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(treatment_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid treatment ID")

    treatment = await db[TREATMENTS_COLLECTION].find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")

    return serialize_treatment(treatment)


@router.put("/{treatment_id}")
async def update_treatment(
    treatment_id: str,
    status: Optional[str] = None,
    effectiveness_rating: Optional[int] = None,
    notes: Optional[str] = None,
    applications_completed: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    """Update treatment status, progress, or effectiveness rating."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(treatment_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid treatment ID")

    treatment = await db[TREATMENTS_COLLECTION].find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")

    update_fields = {"updated_at": datetime.now(timezone.utc)}
    if status is not None:
        if status not in TREATMENT_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status. Use: {', '.join(TREATMENT_STATUSES)}")
        update_fields["status"] = status
        if status in ("completed", "cancelled"):
            update_fields["end_date"] = datetime.now(timezone.utc)
    if effectiveness_rating is not None:
        if not 1 <= effectiveness_rating <= 5:
            raise HTTPException(status_code=400, detail="Rating must be 1-5")
        update_fields["effectiveness_rating"] = effectiveness_rating
    if notes is not None:
        update_fields["notes"] = notes
    if applications_completed is not None:
        update_fields["applications_completed"] = applications_completed
        # Auto-complete if all applications done
        if applications_completed >= treatment.get("total_applications", 1):
            update_fields["status"] = "completed"
            update_fields["end_date"] = datetime.now(timezone.utc)

    await db[TREATMENTS_COLLECTION].update_one({"_id": oid}, {"$set": update_fields})
    updated = await db[TREATMENTS_COLLECTION].find_one({"_id": oid})
    return serialize_treatment(updated)


@router.delete("/{treatment_id}")
async def delete_treatment(treatment_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a treatment record."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(treatment_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid treatment ID")

    result = await db[TREATMENTS_COLLECTION].delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Treatment not found")

    return {"message": "Treatment deleted"}


@router.get("/{treatment_id}/progress")
async def get_treatment_progress(treatment_id: str, current_user: dict = Depends(get_current_user)):
    """Get treatment progress and effectiveness data."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(treatment_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid treatment ID")

    treatment = await db[TREATMENTS_COLLECTION].find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")

    total = treatment.get("total_applications", 1)
    completed = treatment.get("applications_completed", 0)
    progress_pct = round((completed / total * 100), 2) if total > 0 else 0

    start = treatment.get("start_date")
    now = datetime.now(timezone.utc)
    days_active = (now - start).days if isinstance(start, datetime) else 0

    next_app = treatment.get("next_application")
    days_until_next = (next_app - now).days if isinstance(next_app, datetime) else None

    return {
        "treatment_id": treatment_id,
        "status": treatment.get("status"),
        "progress_percent": progress_pct,
        "applications_completed": completed,
        "total_applications": total,
        "days_active": days_active,
        "days_until_next_application": days_until_next,
        "effectiveness_rating": treatment.get("effectiveness_rating"),
        "start_date": start.isoformat() if isinstance(start, datetime) else None,
        "end_date": treatment.get("end_date").isoformat() if isinstance(treatment.get("end_date"), datetime) else None,
    }
