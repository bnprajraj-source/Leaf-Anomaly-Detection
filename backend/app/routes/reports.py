"""
Report Generation Routes
========================
POST /reports/generate   — Generate a PDF/HTML report
GET  /reports            — List generated reports
GET  /reports/{id}       — Download a report
DELETE /reports/{id}     — Delete a report
"""

import io
import logging
import math
import base64
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse, HTMLResponse

from app.database import get_database, is_db_connected, PREDICTIONS_COLLECTION, REPORTS_COLLECTION, USERS_COLLECTION
from app.routes.auth import get_current_user
from app.db_models import PaginatedResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["Reports"])


def serialize_report(doc: dict) -> dict:
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    for field in ("created_at", "date_from", "date_to"):
        if isinstance(doc.get(field), datetime):
            doc[field] = doc[field].isoformat()
    return doc


def _generate_html_report(
    user_name: str,
    date_from: str,
    date_to: str,
    total_scans: int,
    healthy_count: int,
    diseased_count: int,
    disease_counts: dict,
    avg_confidence: float,
    predictions: list,
) -> str:
    """Generate an HTML report."""
    healthy_pct = round((healthy_count / total_scans * 100), 2) if total_scans > 0 else 0

    disease_rows = ""
    for disease, count in sorted(disease_counts.items(), key=lambda x: -x[1]):
        pct = round((count / total_scans * 100), 2) if total_scans > 0 else 0
        color = "#16a34a" if disease == "Healthy" else "#dc2626"
        disease_rows += f"""
        <tr>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb">{disease}</td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center">{count}</td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center;color:{color}">{pct}%</td>
        </tr>"""

    prediction_rows = ""
    for p in predictions[:20]:
        color = "#16a34a" if p.get("prediction") == "Healthy" else "#dc2626"
        created = p.get("created_at", "")
        if isinstance(created, datetime):
            created = created.strftime("%Y-%m-%d %H:%M")
        prediction_rows += f"""
        <tr>
            <td style="padding:8px;border-bottom:1px solid #f3f4f6;font-size:13px">{created}</td>
            <td style="padding:8px;border-bottom:1px solid #f3f4f6;font-size:13px">{p.get("anomaly_type", "N/A")}</td>
            <td style="padding:8px;border-bottom:1px solid #f3f4f6;font-size:13px;color:{color}">{p.get("prediction", "N/A")}</td>
            <td style="padding:8px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:center">{p.get("confidence", 0)}%</td>
        </tr>"""

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Leaf Anomaly Detection Report</title>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f9fafb; color: #1f2937; }}
        .report {{ max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
        .header {{ background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 28px; }}
        .header p {{ margin: 8px 0 0; opacity: 0.9; }}
        .section {{ padding: 25px 30px; border-bottom: 1px solid #f3f4f6; }}
        .section h2 {{ color: #16a34a; margin: 0 0 15px; font-size: 20px; }}
        .stats-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }}
        .stat-card {{ text-align: center; padding: 15px; background: #f9fafb; border-radius: 8px; }}
        .stat-num {{ font-size: 32px; font-weight: bold; color: #16a34a; }}
        .stat-num.danger {{ color: #dc2626; }}
        .stat-label {{ font-size: 12px; color: #6b7280; text-transform: uppercase; margin-top: 5px; }}
        table {{ width: 100%; border-collapse: collapse; }}
        th {{ background: #f9fafb; padding: 10px; text-align: left; font-size: 13px; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }}
        .footer {{ padding: 20px 30px; text-align: center; color: #9ca3af; font-size: 12px; background: #f9fafb; }}
    </style>
</head>
<body>
    <div class="report">
        <div class="header">
            <h1>Leaf Anomaly Detection Report</h1>
            <p>{user_name} | {date_from} to {date_to}</p>
        </div>

        <div class="section">
            <h2>Summary</h2>
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-num">{total_scans}</div><div class="stat-label">Total Scans</div></div>
                <div class="stat-card"><div class="stat-num">{healthy_count}</div><div class="stat-label">Healthy</div></div>
                <div class="stat-card"><div class="stat-num danger">{diseased_count}</div><div class="stat-label">Diseased</div></div>
                <div class="stat-card"><div class="stat-num">{healthy_pct}%</div><div class="stat-label">Health Rate</div></div>
            </div>
        </div>

        <div class="section">
            <h2>Disease Distribution</h2>
            <table>
                <thead><tr><th>Disease</th><th>Count</th><th>Percentage</th></tr></thead>
                <tbody>{disease_rows}</tbody>
            </table>
        </div>

        <div class="section">
            <h2>Average Confidence: {avg_confidence}%</h2>
        </div>

        <div class="section">
            <h2>Recent Predictions</h2>
            <table>
                <thead><tr><th>Date</th><th>Disease</th><th>Status</th><th>Confidence</th></tr></thead>
                <tbody>{prediction_rows}</tbody>
            </table>
        </div>

        <div class="footer">
            <p>Generated on {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")}</p>
            <p>Leaf Anomaly Detection System</p>
        </div>
    </div>
</body>
</html>"""
    return html


@router.post("/generate")
async def generate_report(
    date_from: str,
    date_to: str,
    format: str = "html",
    current_user: dict = Depends(get_current_user),
):
    """Generate a PDF/HTML report for a date range."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    user_id = str(current_user["_id"])

    try:
        start = datetime.strptime(date_from, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        end = datetime.strptime(date_to, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    collection = db[PREDICTIONS_COLLECTION]

    # Get statistics
    pipeline = [
        {"$match": {"user_id": user_id, "created_at": {"$gte": start, "$lte": end}}},
        {
            "$group": {
                "_id": None,
                "total": {"$sum": 1},
                "healthy": {"$sum": {"$cond": [{"$eq": ["$prediction", "Healthy"]}, 1, 0]}},
                "diseased": {"$sum": {"$cond": [{"$eq": ["$prediction", "Diseased"]}, 1, 0]}},
                "avg_confidence": {"$avg": "$confidence"},
            }
        },
    ]
    stats_result = await collection.aggregate(pipeline).to_list(1)
    stats = stats_result[0] if stats_result else {"total": 0, "healthy": 0, "diseased": 0, "avg_confidence": 0}

    # Disease counts
    disease_pipeline = [
        {"$match": {"user_id": user_id, "created_at": {"$gte": start, "$lte": end}}},
        {"$group": {"_id": "$anomaly_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    disease_docs = await collection.aggregate(disease_pipeline).to_list(50)
    disease_counts = {doc["_id"]: doc["count"] for doc in disease_docs}

    # Recent predictions
    cursor = collection.find({
        "user_id": user_id, "created_at": {"$gte": start, "$lte": end}
    }).sort("created_at", -1).limit(50)
    predictions = []
    async for doc in cursor:
        doc.pop("_id", None)
        predictions.append(doc)

    # Generate HTML
    html_content = _generate_html_report(
        user_name=current_user.get("full_name", current_user.get("email", "User")),
        date_from=date_from,
        date_to=date_to,
        total_scans=stats["total"],
        healthy_count=stats["healthy"],
        diseased_count=stats["diseased"],
        disease_counts=disease_counts,
        avg_confidence=round(stats.get("avg_confidence", 0), 2),
        predictions=predictions,
    )

    # Save report metadata
    report_doc = {
        "user_id": user_id,
        "date_from": start,
        "date_to": end,
        "format": format,
        "total_scans": stats["total"],
        "created_at": datetime.now(timezone.utc),
    }
    result = await db[REPORTS_COLLECTION].insert_one(report_doc)

    return {
        "report_id": str(result.inserted_id),
        "format": format,
        "html": html_content if format == "html" else None,
        "stats": {
            "total_scans": stats["total"],
            "healthy": stats["healthy"],
            "diseased": stats["diseased"],
            "avg_confidence": round(stats.get("avg_confidence", 0), 2),
        },
    }


@router.get("/download/{report_id}")
async def download_report(report_id: str, current_user: dict = Depends(get_current_user)):
    """Download a previously generated report."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(report_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid report ID")

    report = await db[REPORTS_COLLECTION].find_one({"_id": oid, "user_id": str(current_user["_id"])})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Regenerate the report
    date_from = report["date_from"].strftime("%Y-%m-%d") if isinstance(report["date_from"], datetime) else str(report["date_from"])
    date_to = report["date_to"].strftime("%Y-%m-%d") if isinstance(report["date_to"], datetime) else str(report["date_to"])

    result = await generate_report(date_from, date_to, "html", current_user)
    return HTMLResponse(content=result["html"])


@router.get("", response_model=PaginatedResponse)
async def list_reports(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """List all generated reports."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    query = {"user_id": str(current_user["_id"])}
    total = await db[REPORTS_COLLECTION].count_documents(query)
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    skip = (page - 1) * per_page

    cursor = db[REPORTS_COLLECTION].find(query).sort("created_at", -1).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        items.append(serialize_report(doc))

    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page, total_pages=total_pages)


@router.delete("/{report_id}")
async def delete_report(report_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a report record."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(report_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid report ID")

    result = await db[REPORTS_COLLECTION].delete_one({"_id": oid, "user_id": str(current_user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")

    return {"message": "Report deleted"}
