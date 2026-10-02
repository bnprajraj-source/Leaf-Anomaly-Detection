"""
Soil Analysis Logging Routes
============================
POST   /soil/log        — Record soil analysis
GET    /soil            — List soil logs
PUT    /soil/{id}       — Update record
DELETE /soil/{id}       — Delete record
GET    /soil/stats      — Soil health overview
"""

import logging
import math
from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_database, is_db_connected, SOIL_COLLECTION
from app.routes.auth import get_current_user
from app.db_models import PaginatedResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/soil", tags=["Soil Analysis"])

SOIL_TYPES = ["clay", "sandy", "loamy", "silty", "peaty", "chalky", "mixed"]
PH_LEVELS = ["very_acidic", "acidic", "neutral", "alkaline", "very_alkaline"]


def serialize_soil(doc: dict) -> dict:
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    for field in ("tested_at", "created_at"):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    return doc


@router.post("/log", status_code=201)
async def log_soil_analysis(
    location_id: Optional[str] = None,
    location_name: Optional[str] = None,
    soil_type: Optional[str] = None,
    ph_level: Optional[float] = None,
    nitrogen_ppm: Optional[float] = None,
    phosphorus_ppm: Optional[float] = None,
    potassium_ppm: Optional[float] = None,
    organic_matter_percent: Optional[float] = None,
    moisture_percent: Optional[float] = None,
    temperature_c: Optional[float] = None,
    electrical_conductivity: Optional[float] = None,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Record a soil analysis result."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    soil_doc = {
        "user_id": str(current_user["_id"]),
        "location_id": location_id,
        "location_name": location_name,
        "soil_type": soil_type,
        "analysis": {
            "ph_level": ph_level,
            "nitrogen_ppm": nitrogen_ppm,
            "phosphorus_ppm": phosphorus_ppm,
            "potassium_ppm": potassium_ppm,
            "organic_matter_percent": organic_matter_percent,
            "moisture_percent": moisture_percent,
            "temperature_c": temperature_c,
            "electrical_conductivity": electrical_conductivity,
        },
        "notes": notes,
        "tested_at": datetime.now(timezone.utc),
    }
    soil_doc["analysis"] = {k: v for k, v in soil_doc["analysis"].items() if v is not None}

    result = await db[SOIL_COLLECTION].insert_one(soil_doc)
    soil_doc["_id"] = result.inserted_id
    return serialize_soil(soil_doc)


@router.get("", response_model=PaginatedResponse)
async def list_soil_logs(
    location_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """List soil analysis logs."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    query = {"user_id": str(current_user["_id"])}
    if location_id:
        query["location_id"] = location_id

    total = await db[SOIL_COLLECTION].count_documents(query)
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    skip = (page - 1) * per_page

    cursor = db[SOIL_COLLECTION].find(query).sort("tested_at", -1).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        items.append(serialize_soil(doc))

    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page, total_pages=total_pages)


@router.get("/stats")
async def get_soil_stats(current_user: dict = Depends(get_current_user)):
    """Get average soil health metrics."""
    db = get_database()
    if db is None:
        return {"stats": {}, "db_connected": False}

    user_id = str(current_user["_id"])

    pipeline = [
        {"$match": {"user_id": user_id}},
        {
            "$group": {
                "_id": None,
                "total_tests": {"$sum": 1},
                "avg_ph": {"$avg": "$analysis.ph_level"},
                "avg_nitrogen": {"$avg": "$analysis.nitrogen_ppm"},
                "avg_phosphorus": {"$avg": "$analysis.phosphorus_ppm"},
                "avg_potassium": {"$avg": "$analysis.potassium_ppm"},
                "avg_organic_matter": {"$avg": "$analysis.organic_matter_percent"},
                "avg_moisture": {"$avg": "$analysis.moisture_percent"},
                "last_test": {"$max": "$tested_at"},
            }
        },
    ]
    results = await db[SOIL_COLLECTION].aggregate(pipeline).to_list(1)
    stats = results[0] if results else {}

    return {
        "stats": {
            "total_tests": stats.get("total_tests", 0),
            "avg_ph": round(stats.get("avg_ph", 0), 2),
            "avg_nitrogen_ppm": round(stats.get("avg_nitrogen", 0), 1),
            "avg_phosphorus_ppm": round(stats.get("avg_phosphorus", 0), 1),
            "avg_potassium_ppm": round(stats.get("avg_potassium", 0), 1),
            "avg_organic_matter_percent": round(stats.get("avg_organic_matter", 0), 1),
            "avg_moisture_percent": round(stats.get("avg_moisture", 0), 1),
            "last_test": stats["last_test"].isoformat() if isinstance(stats.get("last_test"), datetime) else None,
        },
        "db_connected": True,
    }


@router.delete("/{soil_id}")
async def delete_soil_log(soil_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a soil analysis record."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(soil_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid soil log ID")

    result = await db[SOIL_COLLECTION].delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Soil log not found")

    return {"message": "Soil log deleted"}
