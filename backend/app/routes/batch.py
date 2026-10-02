"""
Batch Operations Routes
=======================
POST /batch/plants/update    — Bulk update plants
POST /batch/plants/delete    — Bulk delete plants
POST /batch/plants/tag       — Bulk add tags to plants
POST /batch/predictions/delete — Bulk delete predictions
GET  /batch/export           — Export all user data as JSON
"""

import logging
from datetime import datetime, timezone
from typing import List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_database, is_db_connected, PLANTS_COLLECTION, PREDICTIONS_COLLECTION
from app.routes.auth import get_current_user
from app.utils.email_service import send_email as send_email_func

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/batch", tags=["Batch Operations"])


@router.post("/plants/update")
async def bulk_update_plants(
    plant_ids: List[str],
    health_status: Optional[str] = None,
    location_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Bulk update multiple plants at once."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    if len(plant_ids) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 plants per batch")

    user_id = str(current_user["_id"])
    oids = []
    for pid in plant_ids:
        try:
            oids.append(ObjectId(pid))
        except (InvalidId, TypeError):
            raise HTTPException(status_code=400, detail=f"Invalid plant ID: {pid}")

    update_fields = {"updated_at": datetime.now(timezone.utc)}
    if health_status:
        update_fields["health_status"] = health_status
    if location_id:
        update_fields["location_id"] = location_id

    result = await db[PLANTS_COLLECTION].update_many(
        {"_id": {"$in": oids}, "user_id": user_id},
        {"$set": update_fields}
    )

    return {"message": f"Updated {result.modified_count} plants", "modified_count": result.modified_count}


@router.post("/plants/delete")
async def bulk_delete_plants(
    plant_ids: List[str],
    current_user: dict = Depends(get_current_user),
):
    """Bulk delete multiple plants."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    if len(plant_ids) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 plants per batch")

    user_id = str(current_user["_id"])
    oids = []
    for pid in plant_ids:
        try:
            oids.append(ObjectId(pid))
        except (InvalidId, TypeError):
            raise HTTPException(status_code=400, detail=f"Invalid plant ID: {pid}")

    result = await db[PLANTS_COLLECTION].delete_many({"_id": {"$in": oids}, "user_id": user_id})

    return {"message": f"Deleted {result.deleted_count} plants", "deleted_count": result.deleted_count}


@router.post("/plants/tag")
async def bulk_tag_plants(
    plant_ids: List[str],
    tags: List[str],
    current_user: dict = Depends(get_current_user),
):
    """Add tags to multiple plants at once."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    if len(plant_ids) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 plants per batch")

    user_id = str(current_user["_id"])
    oids = []
    for pid in plant_ids:
        try:
            oids.append(ObjectId(pid))
        except (InvalidId, TypeError):
            raise HTTPException(status_code=400, detail=f"Invalid plant ID: {pid}")

    result = await db[PLANTS_COLLECTION].update_many(
        {"_id": {"$in": oids}, "user_id": user_id},
        {"$addToSet": {"tags": {"$each": tags}}}
    )

    return {"message": f"Tagged {result.modified_count} plants", "modified_count": result.modified_count}


@router.post("/predictions/delete")
async def bulk_delete_predictions(
    prediction_ids: List[str],
    current_user: dict = Depends(get_current_user),
):
    """Bulk delete multiple prediction records."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    if len(prediction_ids) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 predictions per batch")

    user_id = str(current_user["_id"])
    oids = []
    for pid in prediction_ids:
        try:
            oids.append(ObjectId(pid))
        except (InvalidId, TypeError):
            raise HTTPException(status_code=400, detail=f"Invalid prediction ID: {pid}")

    result = await db[PREDICTIONS_COLLECTION].delete_many({"_id": {"$in": oids}, "user_id": user_id})

    return {"message": f"Deleted {result.deleted_count} predictions", "deleted_count": result.deleted_count}


@router.get("/export")
async def export_user_data(
    include_predictions: bool = True,
    include_plants: bool = True,
    include_treatments: bool = True,
    include_weather: bool = True,
    current_user: dict = Depends(get_current_user),
):
    """Export all user data as a JSON-compatible structure."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    user_id = str(current_user["_id"])
    export_data = {
        "export_date": datetime.now(timezone.utc).isoformat(),
        "user": {
            "email": current_user.get("email"),
            "full_name": current_user.get("full_name"),
            "created_at": current_user.get("created_at").isoformat() if isinstance(current_user.get("created_at"), datetime) else None,
        },
    }

    if include_predictions:
        cursor = db[PREDICTIONS_COLLECTION].find({"user_id": user_id}).sort("created_at", -1)
        predictions = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            if isinstance(doc.get("created_at"), datetime):
                doc["created_at"] = doc["created_at"].isoformat()
            predictions.append(doc)
        export_data["predictions"] = predictions
        export_data["prediction_count"] = len(predictions)

    if include_plants:
        from app.routes.plants import serialize_plant
        cursor = db[PLANTS_COLLECTION].find({"user_id": user_id})
        plants = []
        async for doc in cursor:
            plants.append(serialize_plant(doc))
        export_data["plants"] = plants
        export_data["plant_count"] = len(plants)

    if include_treatments:
        from app.routes.treatments import serialize_treatment
        from app.database import TREATMENTS_COLLECTION
        cursor = db[TREATMENTS_COLLECTION].find({"user_id": user_id})
        treatments = []
        async for doc in cursor:
            treatments.append(serialize_treatment(doc))
        export_data["treatments"] = treatments
        export_data["treatment_count"] = len(treatments)

    if include_weather:
        from app.routes.weather import serialize_weather
        from app.database import WEATHER_COLLECTION
        cursor = db[WEATHER_COLLECTION].find({"user_id": user_id}).sort("recorded_at", -1)
        weather = []
        async for doc in cursor:
            weather.append(serialize_weather(doc))
        export_data["weather_logs"] = weather
        export_data["weather_log_count"] = len(weather)

    return export_data
