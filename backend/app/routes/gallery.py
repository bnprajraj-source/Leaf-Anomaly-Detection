"""
Image Gallery Routes
====================
GET    /gallery              — List all scanned images with metadata
GET    /gallery/{id}         — Get image details
DELETE /gallery/{id}         — Delete image from gallery
GET    /gallery/stats        — Gallery statistics
POST   /gallery/compare      — Compare two scanned images
"""

import logging
import math
from datetime import datetime, timezone
from typing import Optional, List

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_database, is_db_connected, PREDICTIONS_COLLECTION, GALLERY_COLLECTION
from app.routes.auth import get_current_user
from app.db_models import PaginatedResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/gallery", tags=["Image Gallery"])


def serialize_gallery_item(doc: dict) -> dict:
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    for field in ("created_at", "scanned_at"):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    return doc


@router.get("", response_model=PaginatedResponse)
async def list_gallery(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    prediction: Optional[str] = Query(None),
    anomaly_type: Optional[str] = Query(None),
    plant_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("newest", regex="^(newest|oldest|confidence)$"),
    current_user: dict = Depends(get_current_user),
):
    """List all scanned images with metadata and filters."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    user_id = str(current_user["_id"])
    query = {"user_id": user_id}

    if prediction:
        query["prediction"] = prediction
    if anomaly_type:
        query["anomaly_type"] = anomaly_type
    if plant_id:
        query["plant_id"] = plant_id
    if search:
        query["$or"] = [
            {"filename": {"$regex": search, "$options": "i"}},
            {"anomaly_type": {"$regex": search, "$options": "i"}},
        ]

    total = await db[PREDICTIONS_COLLECTION].count_documents(query)
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    skip = (page - 1) * per_page

    sort_field = "created_at"
    sort_dir = -1 if sort_by == "newest" else 1
    if sort_by == "confidence":
        sort_field = "confidence"
        sort_dir = -1

    cursor = db[PREDICTIONS_COLLECTION].find(query).sort(sort_field, sort_dir).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        if isinstance(doc.get("created_at"), datetime):
            doc["created_at"] = doc["created_at"].isoformat()
        items.append(doc)

    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page, total_pages=total_pages)


@router.get("/{image_id}")
async def get_image_details(image_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed metadata for a scanned image."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(image_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid image ID")

    doc = await db[PREDICTIONS_COLLECTION].find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not doc:
        raise HTTPException(status_code=404, detail="Image not found")

    doc["id"] = str(doc.pop("_id"))
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()

    return doc


@router.post("/compare")
async def compare_images(
    image_ids: List[str],
    current_user: dict = Depends(get_current_user),
):
    """Compare two or more scanned images side by side."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    if len(image_ids) < 2 or len(image_ids) > 4:
        raise HTTPException(status_code=400, detail="Provide 2-4 image IDs to compare")

    user_id = str(current_user["_id"])
    images = []

    for img_id in image_ids:
        try:
            oid = ObjectId(img_id)
        except (InvalidId, TypeError):
            raise HTTPException(status_code=400, detail=f"Invalid image ID: {img_id}")

        doc = await db[PREDICTIONS_COLLECTION].find_one({"_id": oid, "user_id": user_id})
        if not doc:
            raise HTTPException(status_code=404, detail=f"Image not found: {img_id}")

        doc["id"] = str(doc.pop("_id"))
        if isinstance(doc.get("created_at"), datetime):
            doc["created_at"] = doc["created_at"].isoformat()
        images.append(doc)

    # Compute comparison insights
    predictions = [img.get("prediction") for img in images]
    confidences = [img.get("confidence", 0) for img in images]
    diseases = [img.get("anomaly_type") for img in images]

    return {
        "images": images,
        "comparison": {
            "count": len(images),
            "predictions": predictions,
            "confidences": confidences,
            "avg_confidence": round(sum(confidences) / len(confidences), 2) if confidences else 0,
            "diseases_detected": list(set(d for d in diseases if d != "Healthy")),
            "all_healthy": all(p == "Healthy" for p in predictions),
            "same_disease": len(set(diseases)) == 1,
        },
    }


@router.get("/stats/overview")
async def get_gallery_stats(current_user: dict = Depends(get_current_user)):
    """Get statistics about the image gallery."""
    db = get_database()
    if db is None:
        return {"stats": {}, "db_connected": False}

    user_id = str(current_user["_id"])

    pipeline = [
        {"$match": {"user_id": user_id}},
        {
            "$group": {
                "_id": None,
                "total_images": {"$sum": 1},
                "healthy_count": {"$sum": {"$cond": [{"$eq": ["$prediction", "Healthy"]}, 1, 0]}},
                "diseased_count": {"$sum": {"$cond": [{"$eq": ["$prediction", "Diseased"]}, 1, 0]}},
                "avg_confidence": {"$avg": "$confidence"},
                "first_scan": {"$min": "$created_at"},
                "last_scan": {"$max": "$created_at"},
            }
        },
    ]
    results = await db[PREDICTIONS_COLLECTION].aggregate(pipeline).to_list(1)
    stats = results[0] if results else {}

    # File size estimate (from image_meta)
    size_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": None, "avg_width": {"$avg": "$image_meta.width"}, "avg_height": {"$avg": "$image_meta.height"}}},
    ]
    size_results = await db[PREDICTIONS_COLLECTION].aggregate(size_pipeline).to_list(1)
    size_stats = size_results[0] if size_results else {}

    return {
        "stats": {
            "total_images": stats.get("total_images", 0),
            "healthy_count": stats.get("healthy_count", 0),
            "diseased_count": stats.get("diseased_count", 0),
            "avg_confidence": round(stats.get("avg_confidence", 0), 2),
            "avg_image_width": round(size_stats.get("avg_width", 0), 0),
            "avg_image_height": round(size_stats.get("avg_height", 0), 0),
            "first_scan": stats["first_scan"].isoformat() if isinstance(stats.get("first_scan"), datetime) else None,
            "last_scan": stats["last_scan"].isoformat() if isinstance(stats.get("last_scan"), datetime) else None,
        },
        "db_connected": True,
    }


@router.delete("/{image_id}")
async def delete_image_record(image_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an image record from the gallery."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(image_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid image ID")

    result = await db[PREDICTIONS_COLLECTION].delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Image not found")

    return {"message": "Image record deleted"}
