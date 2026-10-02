"""
History Routes
==============
GET    /history              — List prediction history (paginated)
GET    /history/{id}         — Get a single prediction record
DELETE /history/{id}         — Delete a prediction record
DELETE /history              — Clear all prediction history
GET    /history/export/csv   — Export history as CSV
GET    /stats                — Get aggregated statistics
"""

import csv
import io
import logging
import math
from datetime import datetime
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.database import (
    get_database,
    is_db_connected,
    PREDICTIONS_COLLECTION,
    STATS_COLLECTION,
)
from app.db_models import PaginatedResponse

logger = logging.getLogger(__name__)
router = APIRouter()


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serializable dict."""
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc


def require_db():
    """Check if DB is connected, raise 503 if not."""
    if not is_db_connected():
        raise HTTPException(
            status_code=503,
            detail="MongoDB is not connected. Start MongoDB on port 27017 to use history features."
        )


# ---------------------------------------------------------------------------
# GET /history — Paginated prediction history
# ---------------------------------------------------------------------------
@router.get("/history", response_model=PaginatedResponse)
async def get_prediction_history(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    prediction: Optional[str] = Query(None, description="Filter by prediction type"),
    anomaly_type: Optional[str] = Query(None, description="Filter by anomaly type"),
):
    """
    Retrieve paginated prediction history from MongoDB.
    Optional filters: prediction (Healthy/Diseased), anomaly_type.
    """
    require_db()
    db = get_database()
    collection = db[PREDICTIONS_COLLECTION]

    # Build filter
    query_filter = {}
    if prediction:
        query_filter["prediction"] = prediction
    if anomaly_type:
        query_filter["anomaly_type"] = anomaly_type

    try:
        total = await collection.count_documents(query_filter)
    except Exception as e:
        logger.error(f"Failed to count documents: {e}")
        raise HTTPException(status_code=500, detail="Failed to query prediction history")

    total_pages = math.ceil(total / per_page) if total > 0 else 1
    skip = (page - 1) * per_page

    try:
        cursor = collection.find(query_filter).sort("created_at", -1).skip(skip).limit(per_page)
        items = []
        async for doc in cursor:
            items.append(serialize_doc(doc))
    except Exception as e:
        logger.error(f"Failed to fetch prediction history: {e}")
        raise HTTPException(status_code=500, detail="Failed to query prediction history")

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


# ---------------------------------------------------------------------------
# GET /history/{id} — Get single prediction record
# ---------------------------------------------------------------------------
@router.get("/history/{record_id}")
async def get_prediction_record(record_id: str):
    """Fetch a single prediction record by its MongoDB _id."""
    require_db()
    db = get_database()
    collection = db[PREDICTIONS_COLLECTION]

    try:
        oid = ObjectId(record_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid record ID format")

    try:
        doc = await collection.find_one({"_id": oid})
    except Exception as e:
        logger.error(f"Failed to fetch record: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch record")

    if not doc:
        raise HTTPException(status_code=404, detail="Record not found")

    return serialize_doc(doc)


# ---------------------------------------------------------------------------
# DELETE /history/{id} — Delete single record
# ---------------------------------------------------------------------------
@router.delete("/history/{record_id}")
async def delete_prediction_record(record_id: str):
    """Delete a single prediction record by ID."""
    require_db()
    db = get_database()
    collection = db[PREDICTIONS_COLLECTION]

    try:
        oid = ObjectId(record_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid record ID format")

    try:
        result = await collection.delete_one({"_id": oid})
    except Exception as e:
        logger.error(f"Failed to delete record: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete record")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Record not found")

    return {"message": "Record deleted successfully", "id": record_id}


# ---------------------------------------------------------------------------
# DELETE /history — Clear all history
# ---------------------------------------------------------------------------
@router.delete("/history")
async def clear_prediction_history():
    """Delete all prediction records from the database."""
    require_db()
    db = get_database()
    collection = db[PREDICTIONS_COLLECTION]

    try:
        result = await collection.delete_many({})
        # Reset stats
        stats_col = db[STATS_COLLECTION]
        await stats_col.delete_many({})
    except Exception as e:
        logger.error(f"Failed to clear history: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear prediction history")

    return {
        "message": "All prediction history cleared",
        "deleted_count": result.deleted_count,
    }


# ---------------------------------------------------------------------------
# GET /history/export/csv — Export prediction history as CSV
# ---------------------------------------------------------------------------
@router.get("/history/export/csv")
async def export_history_csv(
    prediction: Optional[str] = Query(None, description="Filter by prediction type"),
    anomaly_type: Optional[str] = Query(None, description="Filter by anomaly type"),
):
    """
    Export prediction history as a downloadable CSV file.
    Optional filters: prediction (Healthy/Diseased), anomaly_type.
    """
    require_db()
    db = get_database()
    collection = db[PREDICTIONS_COLLECTION]

    query_filter = {}
    if prediction:
        query_filter["prediction"] = prediction
    if anomaly_type:
        query_filter["anomaly_type"] = anomaly_type

    try:
        cursor = collection.find(query_filter).sort("created_at", -1)
    except Exception as e:
        logger.error(f"Failed to fetch history for export: {e}")
        raise HTTPException(status_code=500, detail="Failed to export history")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "prediction", "confidence", "anomaly_type", "filename", "created_at"])

    async for doc in cursor:
        doc_id = str(doc.get("_id", ""))
        created = doc.get("created_at")
        created_str = created.isoformat() if isinstance(created, datetime) else str(created)
        writer.writerow([
            doc_id,
            doc.get("prediction", ""),
            doc.get("confidence", 0),
            doc.get("anomaly_type", ""),
            doc.get("filename", ""),
            created_str,
        ])

    output.seek(0)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"leaf_anomaly_history_{timestamp}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ---------------------------------------------------------------------------
# GET /stats — Aggregated statistics
# ---------------------------------------------------------------------------
@router.get("/stats")
async def get_statistics():
    """
    Return aggregated statistics about all predictions:
    - Total predictions
    - Healthy vs Diseased ratio
    - Per-disease counts
    - Average confidence and processing time
    """
    # Return empty stats if DB not connected
    if not is_db_connected():
        return {
            "total_predictions": 0,
            "healthy_count": 0,
            "diseased_count": 0,
            "disease_counts": {},
            "avg_confidence": 0.0,
            "avg_processing_time_ms": 0.0,
            "recent_predictions": [],
            "db_connected": False,
        }

    db = get_database()
    collection = db[PREDICTIONS_COLLECTION]

    try:
        total = await collection.count_documents({})
    except Exception as e:
        logger.error(f"Failed to count documents for stats: {e}")
        return {
            "total_predictions": 0,
            "healthy_count": 0,
            "diseased_count": 0,
            "disease_counts": {},
            "avg_confidence": 0.0,
            "avg_processing_time_ms": 0.0,
            "recent_predictions": [],
            "db_connected": True,
        }

    if total == 0:
        return {
            "total_predictions": 0,
            "healthy_count": 0,
            "diseased_count": 0,
            "disease_counts": {},
            "avg_confidence": 0.0,
            "avg_processing_time_ms": 0.0,
            "recent_predictions": [],
            "db_connected": True,
        }

    try:
        # Aggregate pipeline
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": 1},
                    "healthy_count": {
                        "$sum": {"$cond": [{"$eq": ["$prediction", "Healthy"]}, 1, 0]}
                    },
                    "diseased_count": {
                        "$sum": {"$cond": [{"$eq": ["$prediction", "Diseased"]}, 1, 0]}
                    },
                    "avg_confidence": {"$avg": "$confidence"},
                    "avg_processing_time": {"$avg": "$processing_time_ms"},
                }
            }
        ]
        agg_result = await collection.aggregate(pipeline).to_list(1)
        stats = agg_result[0] if agg_result else {}

        # Disease type counts
        disease_pipeline = [
            {"$group": {"_id": "$anomaly_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        disease_docs = await collection.aggregate(disease_pipeline).to_list(50)
        disease_counts = {doc["_id"]: doc["count"] for doc in disease_docs}

        # Recent predictions (last 5)
        recent_cursor = collection.find().sort("created_at", -1).limit(5)
        recent = []
        async for doc in recent_cursor:
            recent.append(serialize_doc(doc))

        return {
            "total_predictions": stats.get("total", 0),
            "healthy_count": stats.get("healthy_count", 0),
            "diseased_count": stats.get("diseased_count", 0),
            "disease_counts": disease_counts,
            "avg_confidence": round(stats.get("avg_confidence", 0), 2),
            "avg_processing_time_ms": round(stats.get("avg_processing_time", 0), 2),
            "recent_predictions": recent,
            "db_connected": True,
        }
    except Exception as e:
        logger.error(f"Failed to compute statistics: {e}")
        return {
            "total_predictions": 0,
            "healthy_count": 0,
            "diseased_count": 0,
            "disease_counts": {},
            "avg_confidence": 0.0,
            "avg_processing_time_ms": 0.0,
            "recent_predictions": [],
            "db_connected": True,
        }
