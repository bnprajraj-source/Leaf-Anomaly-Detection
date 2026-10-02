"""
Location Management Routes
==========================
POST   /locations          — Create a new location
GET    /locations          — List all locations
GET    /locations/{id}     — Get location details with plants
PUT    /locations/{id}     — Update location
DELETE /locations/{id}     — Delete location
GET    /locations/{id}/stats — Get location health overview
"""

import logging
import math
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_database, is_db_connected, LOCATIONS_COLLECTION, PLANTS_COLLECTION
from app.routes.auth import get_current_user
from app.db_models import PaginatedResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/locations", tags=["Location Management"])


def serialize_location(doc: dict) -> dict:
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    for field in ("created_at", "updated_at"):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    return doc


@router.post("", status_code=201)
async def create_location(
    name: str,
    location_type: str = "garden",
    address: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new location (garden, field, greenhouse, etc.).
    Types: garden, field, greenhouse, balcony, indoor, other
    """
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    location_doc = {
        "user_id": str(current_user["_id"]),
        "name": name,
        "type": location_type,
        "address": address,
        "coordinates": {"lat": latitude, "lng": longitude} if latitude and longitude else None,
        "notes": notes,
        "plant_count": 0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = await db[LOCATIONS_COLLECTION].insert_one(location_doc)
    location_doc["_id"] = result.inserted_id
    return serialize_location(location_doc)


@router.get("", response_model=PaginatedResponse)
async def list_locations(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    location_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """List all locations for the current user."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    query = {"user_id": str(current_user["_id"])}
    if location_type:
        query["type"] = location_type
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    total = await db[LOCATIONS_COLLECTION].count_documents(query)
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    skip = (page - 1) * per_page

    cursor = db[LOCATIONS_COLLECTION].find(query).sort("created_at", -1).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        items.append(serialize_location(doc))

    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page, total_pages=total_pages)


@router.get("/{location_id}")
async def get_location(location_id: str, current_user: dict = Depends(get_current_user)):
    """Get location details with list of plants."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(location_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid location ID")

    location = await db[LOCATIONS_COLLECTION].find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    # Get plants at this location
    cursor = db[PLANTS_COLLECTION].find({"location_id": location_id}).sort("name", 1)
    plants = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        if isinstance(doc.get("created_at"), datetime):
            doc["created_at"] = doc["created_at"].isoformat()
        plants.append(doc)

    result = serialize_location(location)
    result["plants"] = plants
    result["plant_count"] = len(plants)
    return result


@router.put("/{location_id}")
async def update_location(
    location_id: str,
    name: Optional[str] = None,
    location_type: Optional[str] = None,
    address: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Update location information."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(location_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid location ID")

    update_fields = {"updated_at": datetime.now(timezone.utc)}
    if name is not None:
        update_fields["name"] = name
    if location_type is not None:
        update_fields["type"] = location_type
    if address is not None:
        update_fields["address"] = address
    if latitude is not None and longitude is not None:
        update_fields["coordinates"] = {"lat": latitude, "lng": longitude}
    if notes is not None:
        update_fields["notes"] = notes

    result = await db[LOCATIONS_COLLECTION].update_one(
        {"_id": oid, "user_id": str(current_user["_id"])},
        {"$set": update_fields}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")

    location = await db[LOCATIONS_COLLECTION].find_one({"_id": oid})
    return serialize_location(location)


@router.delete("/{location_id}")
async def delete_location(location_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a location. Plants at this location will be unlinked."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(location_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid location ID")

    result = await db[LOCATIONS_COLLECTION].delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")

    # Unlink plants from this location
    await db[PLANTS_COLLECTION].update_many(
        {"location_id": location_id},
        {"$set": {"location_id": None}}
    )

    return {"message": "Location deleted"}


@router.get("/{location_id}/stats")
async def get_location_stats(location_id: str, current_user: dict = Depends(get_current_user)):
    """Get health overview for all plants in a location."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(location_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid location ID")

    location = await db[LOCATIONS_COLLECTION].find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    # Get plant health summary
    pipeline = [
        {"$match": {"location_id": location_id}},
        {
            "$group": {
                "_id": "$health_status",
                "count": {"$sum": 1},
            }
        },
    ]
    health_docs = await db[PLANTS_COLLECTION].aggregate(pipeline).to_list(10)
    health_summary = {doc["_id"]: doc["count"] for doc in health_docs}

    total_plants = sum(health_summary.values())
    healthy = health_summary.get("healthy", 0)
    diseased = health_summary.get("diseased", 0)

    return {
        "location_id": location_id,
        "location_name": location.get("name"),
        "total_plants": total_plants,
        "healthy_plants": healthy,
        "diseased_plants": diseased,
        "health_rate": round((healthy / total_plants * 100), 2) if total_plants > 0 else 0,
        "health_breakdown": health_summary,
    }
