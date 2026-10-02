"""
Weather & Conditions Logging Routes
====================================
POST   /weather/log        — Log weather/conditions with a scan
GET    /weather            — List weather logs
GET    /weather/correlation — Analyze weather-disease correlation
DELETE /weather/{id}       — Delete a weather log
"""

import logging
import math
from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_database, is_db_connected, WEATHER_COLLECTION
from app.routes.auth import get_current_user
from app.db_models import PaginatedResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/weather", tags=["Weather & Conditions"])


def serialize_weather(doc: dict) -> dict:
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    if isinstance(doc.get("recorded_at"), datetime):
        doc["recorded_at"] = doc["recorded_at"].isoformat()
    return doc


@router.post("/log", status_code=201)
async def log_weather(
    prediction_id: Optional[str] = None,
    temperature: Optional[float] = None,
    humidity: Optional[float] = None,
    rainfall_mm: Optional[float] = None,
    wind_speed_kmh: Optional[float] = None,
    cloud_cover: Optional[str] = None,
    soil_moisture: Optional[str] = None,
    light_hours: Optional[float] = None,
    location_name: Optional[str] = None,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Log weather and environmental conditions (optionally linked to a prediction)."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    weather_doc = {
        "user_id": str(current_user["_id"]),
        "prediction_id": prediction_id,
        "conditions": {
            "temperature_c": temperature,
            "humidity_percent": humidity,
            "rainfall_mm": rainfall_mm,
            "wind_speed_kmh": wind_speed_kmh,
            "cloud_cover": cloud_cover,
            "soil_moisture": soil_moisture,
            "light_hours": light_hours,
        },
        "location_name": location_name,
        "notes": notes,
        "recorded_at": datetime.now(timezone.utc),
    }

    # Filter out None values from conditions
    weather_doc["conditions"] = {k: v for k, v in weather_doc["conditions"].items() if v is not None}

    result = await db[WEATHER_COLLECTION].insert_one(weather_doc)
    weather_doc["_id"] = result.inserted_id
    return serialize_weather(weather_doc)


@router.get("", response_model=PaginatedResponse)
async def list_weather_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """List weather logs for the current user."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    query = {"user_id": str(current_user["_id"])}
    if start_date:
        from app.routes.analytics import _parse_date
        query.setdefault("recorded_at", {})["$gte"] = _parse_date(start_date)
    if end_date:
        from app.routes.analytics import _parse_date
        end_dt = _parse_date(end_date).replace(hour=23, minute=59, second=59)
        query.setdefault("recorded_at", {})["$lte"] = end_dt

    total = await db[WEATHER_COLLECTION].count_documents(query)
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    skip = (page - 1) * per_page

    cursor = db[WEATHER_COLLECTION].find(query).sort("recorded_at", -1).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        items.append(serialize_weather(doc))

    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page, total_pages=total_pages)


@router.get("/correlation")
async def get_weather_disease_correlation(
    days: int = Query(90, ge=7, le=365),
    current_user: dict = Depends(get_current_user),
):
    """Analyze correlation between weather conditions and disease occurrences."""
    db = get_database()
    if db is None:
        return {"correlation": {}, "db_connected": False}

    user_id = str(current_user["_id"])
    start = datetime.now(timezone.utc) - timedelta(days=days)

    # Get weather logs with linked predictions
    pipeline = [
        {"$match": {"user_id": user_id, "recorded_at": {"$gte": start}, "prediction_id": {"$ne": None}}},
        {
            "$lookup": {
                "from": "predictions",
                "localField": "prediction_id",
                "foreignField": "_id",
                "as": "prediction",
            }
        },
        {"$unwind": {"path": "$prediction", "preserveNullAndEmptyArrays": True}},
        {
            "$group": {
                "_id": {
                    "disease": "$prediction.anomaly_type",
                    "prediction": "$prediction.prediction",
                },
                "count": {"$sum": 1},
                "avg_temp": {"$avg": "$conditions.temperature_c"},
                "avg_humidity": {"$avg": "$conditions.humidity_percent"},
                "avg_rainfall": {"$avg": "$conditions.rainfall_mm"},
            }
        },
        {"$sort": {"count": -1}},
    ]

    results = await db[WEATHER_COLLECTION].aggregate(pipeline).to_list(50)

    correlation = []
    for r in results:
        correlation.append({
            "disease": r["_id"].get("disease", "Unknown"),
            "prediction": r["_id"].get("prediction", "Unknown"),
            "occurrences": r["count"],
            "avg_temperature_c": round(r.get("avg_temp", 0), 1),
            "avg_humidity_percent": round(r.get("avg_humidity", 0), 1),
            "avg_rainfall_mm": round(r.get("avg_rainfall", 0), 1),
        })

    return {"days": days, "correlation": correlation, "db_connected": True}


@router.get("/summary")
async def get_weather_summary(
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
):
    """Get summary statistics of recorded weather conditions."""
    db = get_database()
    if db is None:
        return {"summary": {}, "db_connected": False}

    user_id = str(current_user["_id"])
    start = datetime.now(timezone.utc) - timedelta(days=days)

    pipeline = [
        {"$match": {"user_id": user_id, "recorded_at": {"$gte": start}}},
        {
            "$group": {
                "_id": None,
                "total_logs": {"$sum": 1},
                "avg_temp": {"$avg": "$conditions.temperature_c"},
                "min_temp": {"$min": "$conditions.temperature_c"},
                "max_temp": {"$max": "$conditions.temperature_c"},
                "avg_humidity": {"$avg": "$conditions.humidity_percent"},
                "avg_rainfall": {"$avg": "$conditions.rainfall_mm"},
                "total_rainfall": {"$sum": "$conditions.rainfall_mm"},
            }
        },
    ]
    results = await db[WEATHER_COLLECTION].aggregate(pipeline).to_list(1)
    stats = results[0] if results else {}

    return {
        "days": days,
        "summary": {
            "total_logs": stats.get("total_logs", 0),
            "avg_temperature_c": round(stats.get("avg_temp", 0), 1),
            "min_temperature_c": round(stats.get("min_temp", 0), 1),
            "max_temperature_c": round(stats.get("max_temp", 0), 1),
            "avg_humidity_percent": round(stats.get("avg_humidity", 0), 1),
            "avg_rainfall_mm": round(stats.get("avg_rainfall", 0), 1),
            "total_rainfall_mm": round(stats.get("total_rainfall", 0), 1),
        },
        "db_connected": True,
    }


@router.delete("/{weather_id}")
async def delete_weather_log(weather_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a weather log."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(weather_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid weather log ID")

    result = await db[WEATHER_COLLECTION].delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Weather log not found")

    return {"message": "Weather log deleted"}
