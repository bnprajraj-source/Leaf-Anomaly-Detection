"""
Advanced Analytics Routes
=========================
GET /analytics/trends      — Prediction trends over time (daily/weekly/monthly)
GET /analytics/comparison  — Compare two time periods
GET /analytics/confidence  — Confidence distribution analysis
GET /analytics/diseases    — Disease frequency analysis with date filtering
GET /analytics/summary     — Quick summary with optional date range
"""

import logging
import math
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_database, is_db_connected, PREDICTIONS_COLLECTION
from app.routes.auth import get_current_user
from app.db_models import PaginatedResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _parse_date(date_str: str) -> datetime:
    """Parse a date string in various formats."""
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y/%m/%d"):
        try:
            return datetime.strptime(date_str, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    raise ValueError(f"Invalid date format: {date_str}. Use YYYY-MM-DD")


# ---------------------------------------------------------------------------
# GET /analytics/trends — Prediction trends over time
# ---------------------------------------------------------------------------
@router.get("/trends")
async def get_prediction_trends(
    period: str = Query("daily", regex="^(daily|weekly|monthly)$", description="Aggregation period"),
    days: int = Query(30, ge=1, le=365, description="Number of days to look back"),
    current_user: dict = Depends(get_current_user),
):
    """
    Get prediction trends over time, grouped by daily, weekly, or monthly periods.
    Returns counts of Healthy vs Diseased predictions.
    """
    if not is_db_connected():
        return {"period": period, "data": [], "db_connected": False}

    db = get_database()
    collection = db[PREDICTIONS_COLLECTION]
    user_id = str(current_user["_id"])

    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    # Determine grouping format
    if period == "daily":
        date_format = "%Y-%m-%d"
        group_id = {"$dateToString": {"format": date_format, "date": "$created_at"}}
    elif period == "weekly":
        date_format = "%Y-W%V"
        group_id = {"$dateToString": {"format": date_format, "date": "$created_at"}}
    else:  # monthly
        date_format = "%Y-%m"
        group_id = {"$dateToString": {"format": date_format, "date": "$created_at"}}

    try:
        pipeline = [
            {"$match": {"user_id": user_id, "created_at": {"$gte": start_date}}},
            {
                "$group": {
                    "_id": {
                        "date": group_id,
                        "prediction": "$prediction",
                    },
                    "count": {"$sum": 1},
                    "avg_confidence": {"$avg": "$confidence"},
                }
            },
            {"$sort": {"_id.date": 1}},
        ]
        results = await collection.aggregate(pipeline).to_list(500)

        # Organize by date
        trends = {}
        for doc in results:
            date_str = doc["_id"]["date"]
            pred_type = doc["_id"]["prediction"]
            if date_str not in trends:
                trends[date_str] = {"date": date_str, "healthy": 0, "diseased": 0, "total": 0}
            if pred_type == "Healthy":
                trends[date_str]["healthy"] = doc["count"]
            else:
                trends[date_str]["diseased"] = doc["count"]
            trends[date_str]["total"] += doc["count"]

        return {
            "period": period,
            "days": days,
            "data": list(trends.values()),
            "db_connected": True,
        }
    except Exception as e:
        logger.error(f"Failed to compute trends: {e}")
        return {"period": period, "data": [], "db_connected": True}


# ---------------------------------------------------------------------------
# GET /analytics/comparison — Compare two time periods
# ---------------------------------------------------------------------------
@router.get("/comparison")
async def compare_periods(
    start_date_1: str = Query(..., description="Start date for period 1 (YYYY-MM-DD)"),
    end_date_1: str = Query(..., description="End date for period 1 (YYYY-MM-DD)"),
    start_date_2: str = Query(..., description="Start date for period 2 (YYYY-MM-DD)"),
    end_date_2: str = Query(..., description="End date for period 2 (YYYY-MM-DD)"),
    current_user: dict = Depends(get_current_user),
):
    """
    Compare prediction statistics between two date ranges.
    Useful for comparing before/after treatment or seasonal analysis.
    """
    if not is_db_connected():
        return {"period_1": {}, "period_2": {}, "db_connected": False}

    db = get_database()
    collection = db[PREDICTIONS_COLLECTION]
    user_id = str(current_user["_id"])

    try:
        s1 = _parse_date(start_date_1)
        e1 = _parse_date(end_date_1).replace(hour=23, minute=59, second=59)
        s2 = _parse_date(start_date_2)
        e2 = _parse_date(end_date_2).replace(hour=23, minute=59, second=59)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    async def get_period_stats(start, end):
        pipeline = [
            {"$match": {"user_id": user_id, "created_at": {"$gte": start, "$lte": end}}},
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": 1},
                    "healthy_count": {"$sum": {"$cond": [{"$eq": ["$prediction", "Healthy"]}, 1, 0]}},
                    "diseased_count": {"$sum": {"$cond": [{"$eq": ["$prediction", "Diseased"]}, 1, 0]}},
                    "avg_confidence": {"$avg": "$confidence"},
                    "avg_processing_time": {"$avg": "$processing_time_ms"},
                }
            },
        ]
        result = await collection.aggregate(pipeline).to_list(1)
        stats = result[0] if result else {}

        disease_pipeline = [
            {"$match": {"user_id": user_id, "created_at": {"$gte": start, "$lte": end}}},
            {"$group": {"_id": "$anomaly_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        disease_docs = await collection.aggregate(disease_pipeline).to_list(50)
        disease_counts = {doc["_id"]: doc["count"] for doc in disease_docs}

        return {
            "total": stats.get("total", 0),
            "healthy_count": stats.get("healthy_count", 0),
            "diseased_count": stats.get("diseased_count", 0),
            "disease_counts": disease_counts,
            "avg_confidence": round(stats.get("avg_confidence", 0), 2),
            "avg_processing_time_ms": round(stats.get("avg_processing_time", 0), 2),
        }

    try:
        period_1 = await get_period_stats(s1, e1)
        period_2 = await get_period_stats(s2, e2)

        # Compute deltas
        total_delta = period_2["total"] - period_1["total"]
        healthy_delta = period_2["healthy_count"] - period_1["healthy_count"]
        diseased_delta = period_2["diseased_count"] - period_1["diseased_count"]
        confidence_delta = round(period_2["avg_confidence"] - period_1["avg_confidence"], 2)

        return {
            "period_1": {"start": start_date_1, "end": end_date_1, **period_1},
            "period_2": {"start": start_date_2, "end": end_date_2, **period_2},
            "deltas": {
                "total": total_delta,
                "healthy": healthy_delta,
                "diseased": diseased_delta,
                "avg_confidence": confidence_delta,
            },
            "db_connected": True,
        }
    except Exception as e:
        logger.error(f"Failed to compare periods: {e}")
        raise HTTPException(status_code=500, detail="Failed to compare periods")


# ---------------------------------------------------------------------------
# GET /analytics/confidence — Confidence distribution analysis
# ---------------------------------------------------------------------------
@router.get("/confidence")
async def get_confidence_distribution(
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user),
):
    """
    Analyze the distribution of prediction confidence scores.
    Returns histogram-like buckets of confidence ranges.
    """
    if not is_db_connected():
        return {"buckets": [], "avg": 0, "median": 0, "db_connected": False}

    db = get_database()
    collection = db[PREDICTIONS_COLLECTION]
    user_id = str(current_user["_id"])
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    try:
        pipeline = [
            {"$match": {"user_id": user_id, "created_at": {"$gte": start_date}}},
            {
                "$bucket": {
                    "groupBy": "$confidence",
                    "boundaries": [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100.01],
                    "default": "other",
                    "output": {
                        "count": {"$sum": 1},
                        "avg_processing_time": {"$avg": "$processing_time_ms"},
                    },
                }
            },
        ]
        buckets = await collection.aggregate(pipeline).to_list(20)

        # Also get overall stats
        stats_pipeline = [
            {"$match": {"user_id": user_id, "created_at": {"$gte": start_date}}},
            {
                "$group": {
                    "_id": None,
                    "avg_confidence": {"$avg": "$confidence"},
                    "min_confidence": {"$min": "$confidence"},
                    "max_confidence": {"$max": "$confidence"},
                    "total": {"$sum": 1},
                }
            },
        ]
        stats_result = await collection.aggregate(stats_pipeline).to_list(1)
        stats = stats_result[0] if stats_result else {}

        return {
            "days": days,
            "buckets": [
                {
                    "range": f"{b['_id']}-{int(b['_id']) + 10 if isinstance(b['_id'], (int, float)) else 'other'}%",
                    "count": b["count"],
                    "avg_processing_time_ms": round(b.get("avg_processing_time", 0), 2),
                }
                for b in buckets
            ],
            "stats": {
                "avg_confidence": round(stats.get("avg_confidence", 0), 2),
                "min_confidence": round(stats.get("min_confidence", 0), 2),
                "max_confidence": round(stats.get("max_confidence", 0), 2),
                "total": stats.get("total", 0),
            },
            "db_connected": True,
        }
    except Exception as e:
        logger.error(f"Failed to compute confidence distribution: {e}")
        return {"buckets": [], "stats": {}, "db_connected": True}


# ---------------------------------------------------------------------------
# GET /analytics/diseases — Disease frequency with date filtering
# ---------------------------------------------------------------------------
@router.get("/diseases")
async def get_disease_frequency(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    current_user: dict = Depends(get_current_user),
):
    """
    Get disease frequency analysis with optional date filtering.
    Returns counts and percentages for each disease type.
    """
    if not is_db_connected():
        return {"diseases": [], "db_connected": False}

    db = get_database()
    collection = db[PREDICTIONS_COLLECTION]
    user_id = str(current_user["_id"])

    match_filter = {"user_id": user_id}
    if start_date:
        match_filter.setdefault("created_at", {})["$gte"] = _parse_date(start_date)
    if end_date:
        end_dt = _parse_date(end_date).replace(hour=23, minute=59, second=59)
        match_filter.setdefault("created_at", {})["$lte"] = end_dt

    try:
        pipeline = [
            {"$match": match_filter},
            {
                "$group": {
                    "_id": "$anomaly_type",
                    "count": {"$sum": 1},
                    "avg_confidence": {"$avg": "$confidence"},
                    "max_confidence": {"$max": "$confidence"},
                    "min_confidence": {"$min": "$confidence"},
                    "first_seen": {"$min": "$created_at"},
                    "last_seen": {"$max": "$created_at"},
                }
            },
            {"$sort": {"count": -1}},
        ]
        results = await collection.aggregate(pipeline).to_list(50)

        total = sum(r["count"] for r in results)

        diseases = []
        for r in results:
            diseases.append({
                "disease": r["_id"],
                "count": r["count"],
                "percentage": round((r["count"] / total * 100), 2) if total > 0 else 0,
                "avg_confidence": round(r.get("avg_confidence", 0), 2),
                "confidence_range": {
                    "min": round(r.get("min_confidence", 0), 2),
                    "max": round(r.get("max_confidence", 0), 2),
                },
                "first_seen": r["first_seen"].isoformat() if isinstance(r.get("first_seen"), datetime) else None,
                "last_seen": r["last_seen"].isoformat() if isinstance(r.get("last_seen"), datetime) else None,
            })

        return {
            "total_predictions": total,
            "diseases": diseases,
            "db_connected": True,
        }
    except Exception as e:
        logger.error(f"Failed to compute disease frequency: {e}")
        return {"diseases": [], "db_connected": True}


# ---------------------------------------------------------------------------
# GET /analytics/summary — Quick summary with optional date range
# ---------------------------------------------------------------------------
@router.get("/summary")
async def get_analytics_summary(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """
    Get a quick analytics summary. Optionally filter by date range.
    Returns key metrics: total predictions, healthy/diseased ratio,
    top disease, avg confidence, and recent activity.
    """
    if not is_db_connected():
        return {"summary": {}, "db_connected": False}

    db = get_database()
    collection = db[PREDICTIONS_COLLECTION]
    user_id = str(current_user["_id"])

    match_filter = {"user_id": user_id}
    if start_date:
        match_filter.setdefault("created_at", {})["$gte"] = _parse_date(start_date)
    if end_date:
        end_dt = _parse_date(end_date).replace(hour=23, minute=59, second=59)
        match_filter.setdefault("created_at", {})["$lte"] = end_dt

    try:
        pipeline = [
            {"$match": match_filter},
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": 1},
                    "healthy_count": {"$sum": {"$cond": [{"$eq": ["$prediction", "Healthy"]}, 1, 0]}},
                    "diseased_count": {"$sum": {"$cond": [{"$eq": ["$prediction", "Diseased"]}, 1, 0]}},
                    "avg_confidence": {"$avg": "$confidence"},
                    "avg_processing_time": {"$avg": "$processing_time_ms"},
                    "first_prediction": {"$min": "$created_at"},
                    "last_prediction": {"$max": "$created_at"},
                }
            },
        ]
        result = await collection.aggregate(pipeline).to_list(1)
        stats = result[0] if result else {}

        # Top disease
        disease_pipeline = [
            {"$match": {**match_filter, "prediction": "Diseased"}},
            {"$group": {"_id": "$anomaly_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 1},
        ]
        top_disease_result = await collection.aggregate(disease_pipeline).to_list(1)
        top_disease = top_disease_result[0]["_id"] if top_disease_result else "None"

        total = stats.get("total", 0)
        healthy = stats.get("healthy_count", 0)
        diseased = stats.get("diseased_count", 0)
        healthy_ratio = round((healthy / total * 100), 2) if total > 0 else 0

        return {
            "summary": {
                "total_predictions": total,
                "healthy_count": healthy,
                "diseased_count": diseased,
                "healthy_ratio_percent": healthy_ratio,
                "top_disease": top_disease,
                "avg_confidence": round(stats.get("avg_confidence", 0), 2),
                "avg_processing_time_ms": round(stats.get("avg_processing_time", 0), 2),
                "first_prediction": stats["first_prediction"].isoformat() if isinstance(stats.get("first_prediction"), datetime) else None,
                "last_prediction": stats["last_prediction"].isoformat() if isinstance(stats.get("last_prediction"), datetime) else None,
            },
            "db_connected": True,
        }
    except Exception as e:
        logger.error(f"Failed to compute summary: {e}")
        return {"summary": {}, "db_connected": True}
