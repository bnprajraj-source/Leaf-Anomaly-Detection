"""
Seasonal Analysis Routes
========================
GET /seasonal/analysis      — Analyze patterns by season/month
GET /seasonal/monthly       — Monthly breakdown
GET /seasonal/yearly        — Year-over-year comparison
GET /seasonal/best-worst    — Best and worst periods
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_database, is_db_connected, PREDICTIONS_COLLECTION
from app.routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/seasonal", tags=["Seasonal Analysis"])

SEASONS = {
    "spring": {"months": [3, 4, 5], "emoji": "🌱"},
    "summer": {"months": [6, 7, 8], "emoji": "☀️"},
    "autumn": {"months": [9, 10, 11], "emoji": "🍂"},
    "winter": {"months": [12, 1, 2], "emoji": "❄️"},
}

MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]


def _get_season(month: int) -> str:
    for season, info in SEASONS.items():
        if month in info["months"]:
            return season
    return "unknown"


@router.get("/analysis")
async def get_seasonal_analysis(
    year: Optional[int] = Query(None, description="Specific year (default: current)"),
    current_user: dict = Depends(get_current_user),
):
    """Analyze prediction patterns by season."""
    db = get_database()
    if db is None:
        return {"analysis": {}, "db_connected": False}

    user_id = str(current_user["_id"])
    now = datetime.now(timezone.utc)
    target_year = year or now.year

    start = datetime(target_year, 1, 1, tzinfo=timezone.utc)
    end = datetime(target_year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)

    pipeline = [
        {"$match": {"user_id": user_id, "created_at": {"$gte": start, "$lte": end}}},
        {
            "$group": {
                "_id": {
                    "month": {"$month": "$created_at"},
                    "prediction": "$prediction",
                },
                "count": {"$sum": 1},
                "avg_confidence": {"$avg": "$confidence"},
            }
        },
    ]
    results = await db[PREDICTIONS_COLLECTION].aggregate(pipeline).to_list(200)

    # Organize by season
    season_data = {s: {"healthy": 0, "diseased": 0, "total": 0, "avg_confidence": []} for s in SEASONS}
    monthly_data = {}

    for r in results:
        month = r["_id"]["month"]
        pred = r["_id"]["prediction"]
        season = _get_season(month)
        count = r["count"]

        if season in season_data:
            if pred == "Healthy":
                season_data[season]["healthy"] += count
            else:
                season_data[season]["diseased"] += count
            season_data[season]["total"] += count
            season_data[season]["avg_confidence"].append(r.get("avg_confidence", 0))

        if month not in monthly_data:
            monthly_data[month] = {"month": MONTH_NAMES[month - 1], "healthy": 0, "diseased": 0, "total": 0}
        if pred == "Healthy":
            monthly_data[month]["healthy"] += count
        else:
            monthly_data[month]["diseased"] += count
        monthly_data[month]["total"] += count

    # Compute season summaries
    analysis = {}
    for season, data in season_data.items():
        confs = data.pop("avg_confidence")
        analysis[season] = {
            **data,
            "health_rate": round((data["healthy"] / data["total"] * 100), 2) if data["total"] > 0 else 0,
            "avg_confidence": round(sum(confs) / len(confs), 2) if confs else 0,
            "emoji": SEASONS[season]["emoji"],
        }

    return {"year": target_year, "seasons": analysis, "db_connected": True}


@router.get("/monthly")
async def get_monthly_breakdown(
    year: Optional[int] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """Get month-by-month breakdown of predictions."""
    db = get_database()
    if db is None:
        return {"months": [], "db_connected": False}

    user_id = str(current_user["_id"])
    now = datetime.now(timezone.utc)
    target_year = year or now.year

    start = datetime(target_year, 1, 1, tzinfo=timezone.utc)
    end = datetime(target_year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)

    pipeline = [
        {"$match": {"user_id": user_id, "created_at": {"$gte": start, "$lte": end}}},
        {
            "$group": {
                "_id": {
                    "month": {"$month": "$created_at"},
                    "prediction": "$prediction",
                    "anomaly_type": "$anomaly_type",
                },
                "count": {"$sum": 1},
                "avg_confidence": {"$avg": "$confidence"},
            }
        },
        {"$sort": {"_id.month": 1}},
    ]
    results = await db[PREDICTIONS_COLLECTION].aggregate(pipeline).to_list(500)

    months = {}
    for r in results:
        month = r["_id"]["month"]
        if month not in months:
            months[month] = {
                "month": MONTH_NAMES[month - 1],
                "month_number": month,
                "healthy": 0,
                "diseased": 0,
                "total": 0,
                "diseases": {},
            }

        pred = r["_id"]["prediction"]
        disease = r["_id"]["anomaly_type"]
        count = r["count"]

        if pred == "Healthy":
            months[month]["healthy"] += count
        else:
            months[month]["diseased"] += count
            months[month]["diseases"][disease] = months[month]["diseases"].get(disease, 0) + count
        months[month]["total"] += count

    # Fill missing months
    for m in range(1, 13):
        if m not in months:
            months[m] = {
                "month": MONTH_NAMES[m - 1],
                "month_number": m,
                "healthy": 0,
                "diseased": 0,
                "total": 0,
                "diseases": {},
            }

    month_list = [months[m] for m in range(1, 13)]
    for m in month_list:
        m["health_rate"] = round((m["healthy"] / m["total"] * 100), 2) if m["total"] > 0 else 0

    return {"year": target_year, "months": month_list, "db_connected": True}


@router.get("/best-worst")
async def get_best_worst_periods(
    days: int = Query(365, ge=30, le=1825),
    current_user: dict = Depends(get_current_user),
):
    """Identify the best and worst health periods."""
    db = get_database()
    if db is None:
        return {"best": {}, "worst": {}, "db_connected": False}

    user_id = str(current_user["_id"])
    start = datetime.now(timezone.utc) - timedelta(days=days)

    # Monthly aggregation
    pipeline = [
        {"$match": {"user_id": user_id, "created_at": {"$gte": start}}},
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$created_at"},
                    "month": {"$month": "$created_at"},
                },
                "total": {"$sum": 1},
                "healthy": {"$sum": {"$cond": [{"$eq": ["$prediction", "Healthy"]}, 1, 0]}},
                "diseased": {"$sum": {"$cond": [{"$eq": ["$prediction", "Diseased"]}, 1, 0]}},
            }
        },
    ]
    results = await db[PREDICTIONS_COLLECTION].aggregate(pipeline).to_list(100)

    month_stats = []
    for r in results:
        total = r["total"]
        healthy = r["healthy"]
        health_rate = round((healthy / total * 100), 2) if total > 0 else 0
        month_stats.append({
            "year": r["_id"]["year"],
            "month": MONTH_NAMES[r["_id"]["month"] - 1],
            "total_scans": total,
            "healthy_count": healthy,
            "diseased_count": r["diseased"],
            "health_rate": health_rate,
        })

    if not month_stats:
        return {"best": None, "worst": None, "db_connected": True}

    month_stats.sort(key=lambda x: x["health_rate"], reverse=True)
    best = month_stats[0]
    worst = month_stats[-1]

    return {"best": best, "worst": worst, "total_months_analyzed": len(month_stats), "db_connected": True}
