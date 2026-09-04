"""
Prediction Routes
=================
POST /predict  — Upload a leaf image and receive an anomaly prediction.
GET  /health   — Health check endpoint.
"""

import logging
import time
from datetime import datetime, timezone

from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from app.config import DEVICE
from app.database import get_database, is_db_connected, PREDICTIONS_COLLECTION
from app.models.leaf_model import load_model, predict
from app.utils.image_processing import (
    load_image_from_bytes,
    validate_image,
    get_image_metadata,
)
from app.utils.preprocessing import preprocess_image

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# POST /predict
# ---------------------------------------------------------------------------

@router.post("/predict")
async def predict_leaf_anomaly(request: Request, file: UploadFile = File(...)):
    """
    Accept a leaf image upload and return anomaly detection results.
    Also saves the prediction record to MongoDB if connected.

    **Request:** multipart/form-data with field `file` (image).

    **Response:**
    ```json
    {
      "prediction":  "Healthy" | "Diseased",
      "confidence":  95.2,
      "anomaly_type": "Leaf Spot",
      "all_scores":  { "Healthy": 2.1, "Leaf Spot": 95.2, ... },
      "processing_time_ms": 140,
      "image_meta": { "width": 1024, "height": 768, ... },
      "record_id": "64f..."
    }
    ```
    """
    start = time.perf_counter()

    # ---- 1. Read file bytes ------------------------------------------------
    try:
        image_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read upload: {e}")

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    # ---- 2. Validate -------------------------------------------------------
    try:
        validate_image(image_bytes, file.content_type or "image/jpeg")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # ---- 3. Decode image ---------------------------------------------------
    try:
        img = load_image_from_bytes(image_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    meta = get_image_metadata(img)
    logger.info(f"Received image: {meta}")

    # ---- 4. Preprocess -----------------------------------------------------
    try:
        tensor = preprocess_image(img)
    except Exception as e:
        logger.exception("Preprocessing failed")
        raise HTTPException(status_code=500, detail=f"Preprocessing error: {e}")

    # ---- 5. Load model & predict -------------------------------------------
    try:
        model  = load_model(DEVICE)
        result = predict(tensor, model, DEVICE)
    except Exception as e:
        logger.exception("Model inference failed")
        raise HTTPException(status_code=500, detail=f"Inference error: {e}")

    elapsed_ms = round((time.perf_counter() - start) * 1000, 1)
    logger.info(
        f"Prediction: {result['prediction']} ({result['anomaly_type']}) "
        f"conf={result['confidence']}% in {elapsed_ms}ms"
    )

    # ---- 6. Save to MongoDB (if connected) ---------------------------------
    record_id = None
    db = get_database()
    if db is not None:
        try:
            collection = db[PREDICTIONS_COLLECTION]
            record = {
                "prediction": result["prediction"],
                "confidence": result["confidence"],
                "anomaly_type": result["anomaly_type"],
                "all_scores": result.get("all_scores", {}),
                "processing_time_ms": elapsed_ms,
                "image_meta": meta,
                "attention_map_available": result.get("attention_map_available", False),
                "filename": file.filename,
                "created_at": datetime.now(timezone.utc),
                "user_agent": request.headers.get("user-agent"),
            }
            insert_result = await collection.insert_one(record)
            record_id = str(insert_result.inserted_id)
            logger.info(f"Prediction saved to MongoDB: {record_id}")
        except Exception as e:
            logger.warning(f"Failed to save prediction to MongoDB: {e}")
            # Don't fail the request — prediction still succeeded
    else:
        logger.info("MongoDB not connected — prediction not saved to history")

    return JSONResponse(content={
        **result,
        "processing_time_ms": elapsed_ms,
        "image_meta":         meta,
        "record_id":          record_id,
        "db_connected":       is_db_connected(),
    })


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

@router.get("/health")
async def health_check():
    """Return API health status, model readiness, and DB connection status."""
    # Check model
    try:
        model = load_model(DEVICE)
        model_ready = model is not None
    except Exception:
        model_ready = False

    # Check MongoDB
    db_connected = is_db_connected()

    return {
        "status":       "healthy" if model_ready else "degraded",
        "model_ready":  model_ready,
        "db_connected": db_connected,
        "device":       DEVICE,
        "version":      "1.0.0",
    }
