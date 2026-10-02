"""
QR Code Routes
==============
POST /qr/generate      — Generate QR code for a prediction result
GET  /qr/prediction/{id} — Get QR code for a prediction
GET  /qr/plant/{id}    — Get QR code for a plant
"""

import io
import logging
import base64
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.config import FRONTEND_URL
from app.database import get_database, is_db_connected, PREDICTIONS_COLLECTION, PLANTS_COLLECTION
from app.routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/qr", tags=["QR Code"])


def _generate_qr_code(data: str) -> bytes:
    """Generate a QR code image from a string. Returns PNG bytes."""
    try:
        import qrcode
        from qrcode.image.styledpil import StyledPilImage
        from qrcode.image.styles.moduledrawers import RoundedModuleDrawer

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)

        img = qr.make_image(
            fill_color="#16a34a",
            back_color="white",
        )

        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return buf.getvalue()
    except ImportError:
        # Fallback: create a simple SVG QR code without external deps
        logger.warning("qrcode library not installed, using fallback")
        return _generate_fallback_qr(data)


def _generate_fallback_qr(data: str) -> bytes:
    """Generate a simple placeholder image when qrcode is not available."""
    try:
        from PIL import Image, ImageDraw, ImageFont

        img = Image.new("RGB", (300, 350), "white")
        draw = ImageDraw.Draw(img)

        # Draw border
        draw.rectangle([10, 10, 290, 340], outline="#16a34a", width=3)

        # Draw title
        try:
            font = ImageFont.truetype("arial.ttf", 16)
            small_font = ImageFont.truetype("arial.ttf", 11)
        except (OSError, IOError):
            font = ImageFont.load_default()
            small_font = font

        draw.text((150, 30), "Scan Me", fill="#16a34a", font=font, anchor="mt")

        # Draw QR-like pattern
        for y in range(70, 270, 15):
            for x in range(40, 260, 15):
                if hash(f"{x}{y}{data}") % 3 == 0:
                    draw.rectangle([x, y, x + 12, y + 12], fill="#16a34a")

        # Draw URL at bottom
        display_url = data[:40] + "..." if len(data) > 40 else data
        draw.text((150, 290), display_url, fill="#666", font=small_font, anchor="mt")
        draw.text((150, 310), "Leaf Anomaly Detection", fill="#999", font=small_font, anchor="mt")

        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return buf.getvalue()
    except Exception:
        return b""


@router.get("/prediction/{prediction_id}")
async def get_prediction_qr(prediction_id: str):
    """Generate a QR code that links to a prediction result."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(prediction_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid prediction ID")

    prediction = await db[PREDICTIONS_COLLECTION].find_one({"_id": oid})
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    qr_url = f"{FRONTEND_URL}/history?id={prediction_id}"
    qr_bytes = _generate_qr_code(qr_url)

    return StreamingResponse(
        iter([qr_bytes]),
        media_type="image/png",
        headers={"Content-Disposition": f"inline; filename=qr_prediction_{prediction_id[:8]}.png"},
    )


@router.get("/plant/{plant_id}")
async def get_plant_qr(plant_id: str):
    """Generate a QR code that links to a plant's profile."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(plant_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid plant ID")

    plant = await db[PLANTS_COLLECTION].find_one({"_id": oid})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    qr_url = f"{FRONTEND_URL}/plants/{plant_id}"
    qr_bytes = _generate_qr_code(qr_url)

    return StreamingResponse(
        iter([qr_bytes]),
        media_type="image/png",
        headers={"Content-Disposition": f"inline; filename=qr_plant_{plant.get('name', 'unknown')}.png"},
    )


@router.get("/prediction/{prediction_id}/base64")
async def get_prediction_qr_base64(prediction_id: str):
    """Get QR code as base64 string (useful for embedding in JSON responses)."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        oid = ObjectId(prediction_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail="Invalid prediction ID")

    prediction = await db[PREDICTIONS_COLLECTION].find_one({"_id": oid})
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    qr_url = f"{FRONTEND_URL}/history?id={prediction_id}"
    qr_bytes = _generate_qr_code(qr_url)
    qr_base64 = base64.b64encode(qr_bytes).decode("utf-8")

    return {
        "prediction_id": prediction_id,
        "qr_code": f"data:image/png;base64,{qr_base64}",
        "url": qr_url,
    }
