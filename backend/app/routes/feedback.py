"""
Feedback Routes
===============
POST   /feedback              — Submit feedback for a prediction
GET    /feedback              — List all feedback (admin)
GET    /feedback/{record_id}  — Get feedback for a specific prediction
DELETE /feedback/{id}         — Delete feedback
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_database, is_db_connected, FEEDBACK_COLLECTION
from app.routes.auth import get_current_user
from app.db_models import PaginatedResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/feedback", tags=["Feedback"])


def serialize_feedback(doc: dict) -> dict:
    """Convert MongoDB feedback document to JSON-serializable dict."""
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc


# ---------------------------------------------------------------------------
# POST /feedback — Submit feedback for a prediction
# ---------------------------------------------------------------------------
@router.post("", status_code=201)
async def submit_feedback(
    prediction_id: str,
    rating: int = Query(..., ge=1, le=5, description="Rating 1-5"),
    comment: Optional[str] = Query(None, description="Optional comment"),
    correct: Optional[bool] = Query(None, description="Was the prediction correct?"),
    current_user: dict = Depends(get_current_user),
):
    """Submit feedback (rating, comment, correctness) for a specific prediction."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    # Verify prediction exists
    try:
        pred_oid = ObjectId(prediction_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid prediction ID format")

    pred = await db["predictions"].find_one({"_id": pred_oid})
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found")

    feedback_doc = {
        "prediction_id": prediction_id,
        "user_id": str(current_user["_id"]),
        "rating": rating,
        "comment": comment,
        "correct": correct,
        "created_at": datetime.now(timezone.utc),
    }

    try:
        result = await db[FEEDBACK_COLLECTION].insert_one(feedback_doc)
        feedback_doc["id"] = str(result.inserted_id)
        if "_id" in feedback_doc:
            del feedback_doc["_id"]
    except Exception as e:
        logger.error(f"Failed to submit feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit feedback")

    logger.info(f"Feedback submitted by {current_user['email']} for prediction {prediction_id}")
    return serialize_feedback(feedback_doc)


# ---------------------------------------------------------------------------
# GET /feedback — List feedback with pagination
# ---------------------------------------------------------------------------
@router.get("", response_model=PaginatedResponse)
async def list_feedback(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """List all feedback submitted by the current user."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    user_id = str(current_user["_id"])
    collection = db[FEEDBACK_COLLECTION]

    total = await collection.count_documents({"user_id": user_id})
    import math
    total_pages = math.ceil(total / per_page) if total > 0 else 1
    skip = (page - 1) * per_page

    cursor = collection.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        items.append(serialize_feedback(doc))

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


# ---------------------------------------------------------------------------
# GET /feedback/{prediction_id} — Get feedback for a prediction
# ---------------------------------------------------------------------------
@router.get("/{prediction_id}")
async def get_feedback_for_prediction(prediction_id: str):
    """Get all feedback for a specific prediction."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    cursor = db[FEEDBACK_COLLECTION].find({"prediction_id": prediction_id}).sort("created_at", -1)
    items = []
    async for doc in cursor:
        items.append(serialize_feedback(doc))

    return {"prediction_id": prediction_id, "feedback": items, "count": len(items)}


# ---------------------------------------------------------------------------
# DELETE /feedback/{id} — Delete feedback
# ---------------------------------------------------------------------------
@router.delete("/{feedback_id}")
async def delete_feedback(feedback_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a feedback record (only owner can delete)."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(feedback_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid feedback ID format")

    result = await db[FEEDBACK_COLLECTION].delete_one({
        "_id": oid,
        "user_id": str(current_user["_id"]),
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Feedback not found")

    return {"message": "Feedback deleted successfully", "id": feedback_id}
