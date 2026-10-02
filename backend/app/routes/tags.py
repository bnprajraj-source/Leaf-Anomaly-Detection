"""
Tags / Labels Routes
====================
POST   /tags         — Create a new tag
GET    /tags         — List all user tags
PUT    /tags/{id}    — Update tag
DELETE /tags/{id}    — Delete tag
POST   /tags/{id}/plants — Add plants to tag
DELETE /tags/{id}/plants — Remove plants from tag
"""

import logging
import math
from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_database, is_db_connected, TAGS_COLLECTION, PLANTS_COLLECTION
from app.routes.auth import get_current_user
from app.db_models import PaginatedResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tags", tags=["Tags & Labels"])

# Predefined colors for tags
TAG_COLORS = [
    "#16a34a", "#dc2626", "#2563eb", "#f59e0b", "#8b5cf6",
    "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
]


def serialize_tag(doc: dict) -> dict:
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc


@router.post("", status_code=201)
async def create_tag(
    name: str,
    color: Optional[str] = None,
    description: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Create a new tag/label for organizing plants."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    user_id = str(current_user["_id"])

    # Check for duplicate name
    existing = await db[TAGS_COLLECTION].find_one({"user_id": user_id, "name": name})
    if existing:
        raise HTTPException(status_code=400, detail="Tag with this name already exists")

    tag_doc = {
        "user_id": user_id,
        "name": name,
        "color": color or TAG_COLORS[0],
        "description": description,
        "plant_ids": [],
        "plant_count": 0,
        "created_at": datetime.now(timezone.utc),
    }

    result = await db[TAGS_COLLECTION].insert_one(tag_doc)
    tag_doc["_id"] = result.inserted_id
    return serialize_tag(tag_doc)


@router.get("", response_model=PaginatedResponse)
async def list_tags(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """List all tags for the current user."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    query = {"user_id": str(current_user["_id"])}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    total = await db[TAGS_COLLECTION].count_documents(query)
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    skip = (page - 1) * per_page

    cursor = db[TAGS_COLLECTION].find(query).sort("name", 1).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        items.append(serialize_tag(doc))

    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page, total_pages=total_pages)


@router.get("/{tag_id}")
async def get_tag(tag_id: str, current_user: dict = Depends(get_current_user)):
    """Get tag details with associated plants."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(tag_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid tag ID")

    tag = await db[TAGS_COLLECTION].find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    # Get plants with this tag
    plant_ids = tag.get("plant_ids", [])
    plants = []
    if plant_ids:
        plant_oids = [ObjectId(pid) for pid in plant_ids if ObjectId.is_valid(pid)]
        cursor = db[PLANTS_COLLECTION].find({"_id": {"$in": plant_oids}})
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            if isinstance(doc.get("created_at"), datetime):
                doc["created_at"] = doc["created_at"].isoformat()
            plants.append(doc)

    result = serialize_tag(tag)
    result["plants"] = plants
    return result


@router.put("/{tag_id}")
async def update_tag(
    tag_id: str,
    name: Optional[str] = None,
    color: Optional[str] = None,
    description: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Update tag name, color, or description."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(tag_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid tag ID")

    update_fields = {}
    if name is not None:
        # Check duplicate
        existing = await db[TAGS_COLLECTION].find_one({
            "user_id": str(current_user["_id"]),
            "name": name,
            "_id": {"$ne": oid},
        })
        if existing:
            raise HTTPException(status_code=400, detail="Tag name already exists")
        update_fields["name"] = name
    if color is not None:
        update_fields["color"] = color
    if description is not None:
        update_fields["description"] = description

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db[TAGS_COLLECTION].update_one(
        {"_id": oid, "user_id": str(current_user["_id"])},
        {"$set": update_fields}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Tag not found")

    tag = await db[TAGS_COLLECTION].find_one({"_id": oid})
    return serialize_tag(tag)


@router.delete("/{tag_id}")
async def delete_tag(tag_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a tag. Plants are unlinked but not deleted."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(tag_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid tag ID")

    # Remove tag from all plants
    await db[PLANTS_COLLECTION].update_many(
        {"tags": tag_id},
        {"$pull": {"tags": tag_id}}
    )

    result = await db[TAGS_COLLECTION].delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tag not found")

    return {"message": "Tag deleted"}


@router.post("/{tag_id}/plants")
async def add_plants_to_tag(
    tag_id: str,
    plant_ids: List[str],
    current_user: dict = Depends(get_current_user),
):
    """Add plants to a tag."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(tag_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid tag ID")

    tag = await db[TAGS_COLLECTION].find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    # Add plants to tag
    await db[TAGS_COLLECTION].update_one(
        {"_id": oid},
        {"$addToSet": {"plant_ids": {"$each": plant_ids}}}
    )

    # Add tag to plants
    await db[PLANTS_COLLECTION].update_many(
        {"_id": {"$in": [ObjectId(pid) for pid in plant_ids if ObjectId.is_valid(pid)]}},
        {"$addToSet": {"tags": tag_id}}
    )

    # Update plant count
    updated_tag = await db[TAGS_COLLECTION].find_one({"_id": oid})
    plant_count = len(updated_tag.get("plant_ids", []))
    await db[TAGS_COLLECTION].update_one({"_id": oid}, {"$set": {"plant_count": plant_count}})

    return {"message": f"Added {len(plant_ids)} plants to tag", "tag_id": tag_id}


@router.delete("/{tag_id}/plants")
async def remove_plants_from_tag(
    tag_id: str,
    plant_ids: List[str],
    current_user: dict = Depends(get_current_user),
):
    """Remove plants from a tag."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(tag_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid tag ID")

    # Remove plants from tag
    await db[TAGS_COLLECTION].update_one(
        {"_id": oid},
        {"$pull": {"plant_ids": {"$in": plant_ids}}}
    )

    # Remove tag from plants
    await db[PLANTS_COLLECTION].update_many(
        {"_id": {"$in": [ObjectId(pid) for pid in plant_ids if ObjectId.is_valid(pid)]}},
        {"$pull": {"tags": tag_id}}
    )

    # Update plant count
    updated_tag = await db[TAGS_COLLECTION].find_one({"_id": oid})
    plant_count = len(updated_tag.get("plant_ids", []))
    await db[TAGS_COLLECTION].update_one({"_id": oid}, {"$set": {"plant_count": plant_count}})

    return {"message": f"Removed {len(plant_ids)} plants from tag", "tag_id": tag_id}
