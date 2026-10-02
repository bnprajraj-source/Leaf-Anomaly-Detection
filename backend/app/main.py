"""
Leaf Anomaly Detection — FastAPI Application Entry Point
=========================================================
Run with:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    API_TITLE, API_VERSION, API_DESCRIPTION, CORS_ORIGINS,
    MODEL_PATH, SAVED_MODELS_DIR
)
from app.routes.prediction import router as prediction_router
from app.routes.history import router as history_router
from app.routes.auth import router as auth_router
from app.routes.feedback import router as feedback_router
from app.routes.diseases import router as diseases_router
from app.routes.analytics import router as analytics_router
from app.routes.notifications import router as notifications_router
from app.routes.plants import router as plants_router
from app.routes.locations import router as locations_router
from app.routes.treatments import router as treatments_router
from app.routes.qr_code import router as qr_router
from app.routes.reports import router as reports_router
from app.routes.audit import router as audit_router
from app.routes.weather import router as weather_router
from app.routes.gallery import router as gallery_router
from app.routes.batch import router as batch_router
from app.routes.seasonal import router as seasonal_router
from app.routes.tags import router as tags_router
from app.routes.growth import router as growth_router
from app.routes.irrigation import router as irrigation_router
from app.routes.fertilizer import router as fertilizer_router
from app.routes.soil import router as soil_router
from app.routes.harvest import router as harvest_router
from app.routes.expenses import router as expenses_router
from app.routes.import_csv import router as import_router
from app.middleware.rate_limit import RateLimitMiddleware
from app.database import (
    connect_db, close_db, is_db_connected, get_database,
    USERS_COLLECTION, PREDICTIONS_COLLECTION, FEEDBACK_COLLECTION, BLACKLIST_COLLECTION,
    PLANTS_COLLECTION, LOCATIONS_COLLECTION, TREATMENTS_COLLECTION,
    NOTIFICATIONS_COLLECTION, REPORTS_COLLECTION, AUDIT_LOG_COLLECTION,
    WEATHER_COLLECTION, GALLERY_COLLECTION, TAGS_COLLECTION,
    GROWTH_STAGES_COLLECTION, IRRIGATION_COLLECTION, FERTILIZER_COLLECTION,
    SOIL_COLLECTION, HARVEST_COLLECTION, EXPENSES_COLLECTION
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


async def _ensure_indexes():
    """Create MongoDB indexes on startup for better query performance."""
    db = get_database()
    if db is None:
        return
    try:
        # Users
        await db[USERS_COLLECTION].create_index("email", unique=True)
        # Predictions
        await db[PREDICTIONS_COLLECTION].create_index("created_at")
        await db[PREDICTIONS_COLLECTION].create_index("prediction")
        await db[PREDICTIONS_COLLECTION].create_index("anomaly_type")
        await db[PREDICTIONS_COLLECTION].create_index("user_id")
        await db[PREDICTIONS_COLLECTION].create_index("plant_id")
        # Feedback
        await db[FEEDBACK_COLLECTION].create_index("prediction_id")
        await db[FEEDBACK_COLLECTION].create_index("user_id")
        await db[FEEDBACK_COLLECTION].create_index("created_at")
        # Token blacklist
        await db[BLACKLIST_COLLECTION].create_index("token", unique=True)
        await db[BLACKLIST_COLLECTION].create_index("expires_at", expireAfterSeconds=0)
        # Plants
        await db[PLANTS_COLLECTION].create_index("user_id")
        await db[PLANTS_COLLECTION].create_index("location_id")
        await db[PLANTS_COLLECTION].create_index("health_status")
        # Locations
        await db[LOCATIONS_COLLECTION].create_index("user_id")
        # Treatments
        await db[TREATMENTS_COLLECTION].create_index("user_id")
        await db[TREATMENTS_COLLECTION].create_index("plant_id")
        await db[TREATMENTS_COLLECTION].create_index("status")
        # Notifications
        await db[NOTIFICATIONS_COLLECTION].create_index("user_id")
        await db[NOTIFICATIONS_COLLECTION].create_index("read")
        # Reports
        await db[REPORTS_COLLECTION].create_index("user_id")
        # Audit logs
        await db[AUDIT_LOG_COLLECTION].create_index("user_id")
        await db[AUDIT_LOG_COLLECTION].create_index("timestamp")
        await db[AUDIT_LOG_COLLECTION].create_index("action")
        # Weather
        await db[WEATHER_COLLECTION].create_index("user_id")
        await db[WEATHER_COLLECTION].create_index("recorded_at")
        # Tags
        await db[TAGS_COLLECTION].create_index("user_id")
        await db[TAGS_COLLECTION].create_index("name")
        # Growth stages
        await db[GROWTH_STAGES_COLLECTION].create_index("user_id")
        await db[GROWTH_STAGES_COLLECTION].create_index("plant_id")
        await db[GROWTH_STAGES_COLLECTION].create_index("recorded_at")
        # Irrigation
        await db[IRRIGATION_COLLECTION].create_index("user_id")
        await db[IRRIGATION_COLLECTION].create_index("plant_id")
        await db[IRRIGATION_COLLECTION].create_index("watered_at")
        # Fertilizer
        await db[FERTILIZER_COLLECTION].create_index("user_id")
        await db[FERTILIZER_COLLECTION].create_index("plant_id")
        # Soil
        await db[SOIL_COLLECTION].create_index("user_id")
        await db[SOIL_COLLECTION].create_index("tested_at")
        # Harvest
        await db[HARVEST_COLLECTION].create_index("user_id")
        await db[HARVEST_COLLECTION].create_index("plant_id")
        await db[HARVEST_COLLECTION].create_index("harvested_at")
        # Expenses
        await db[EXPENSES_COLLECTION].create_index("user_id")
        await db[EXPENSES_COLLECTION].create_index("category")
        await db[EXPENSES_COLLECTION].create_index("expense_date")
        logger.info("MongoDB indexes ensured.")
    except Exception as e:
        logger.warning(f"Failed to create indexes: {e}")


def _check_model():
    """Log model file status at startup."""
    if MODEL_PATH.exists():
        size_mb = MODEL_PATH.stat().st_size / (1024 * 1024)
        logger.info(f"Model file found: {MODEL_PATH} ({size_mb:.1f} MB)")
    else:
        logger.warning(
            f"Model file not found at {MODEL_PATH}. "
            "The model will use pretrained ResNet-50 backbone without fine-tuned weights. "
            "Train the model for accurate predictions."
        )


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info(f"  {API_TITLE}  v{API_VERSION}")
    logger.info("=" * 60)

    # Check model file
    _check_model()

    # Connect to database (with auto-reconnect background task)
    await connect_db()

    if is_db_connected():
        logger.info("MongoDB: CONNECTED")
        await _ensure_indexes()
    else:
        logger.warning("MongoDB: DISCONNECTED — running without database")
        logger.warning("History features will be unavailable until MongoDB is started.")

    logger.info("Server ready — visit http://localhost:8000/docs")
    yield
    await close_db()
    logger.info("Server shutting down")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Rate Limiting
# ---------------------------------------------------------------------------
app.add_middleware(RateLimitMiddleware)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(prediction_router, tags=["Detection"])
app.include_router(history_router, tags=["History & Stats"])
app.include_router(auth_router, tags=["Auth"])
app.include_router(feedback_router, tags=["Feedback"])
app.include_router(diseases_router, tags=["Disease Info"])
app.include_router(analytics_router, tags=["Analytics"])
app.include_router(notifications_router, tags=["Notifications"])
app.include_router(plants_router, tags=["Plant Tracking"])
app.include_router(locations_router, tags=["Location Management"])
app.include_router(treatments_router, tags=["Treatment Tracking"])
app.include_router(qr_router, tags=["QR Code"])
app.include_router(reports_router, tags=["Reports"])
app.include_router(audit_router, tags=["Audit Log"])
app.include_router(weather_router, tags=["Weather & Conditions"])
app.include_router(gallery_router, tags=["Image Gallery"])
app.include_router(batch_router, tags=["Batch Operations"])
app.include_router(seasonal_router, tags=["Seasonal Analysis"])
app.include_router(tags_router, tags=["Tags & Labels"])
app.include_router(growth_router, tags=["Growth Stage Tracking"])
app.include_router(irrigation_router, tags=["Irrigation & Watering"])
app.include_router(fertilizer_router, tags=["Fertilizer Tracking"])
app.include_router(soil_router, tags=["Soil Analysis"])
app.include_router(harvest_router, tags=["Harvest Tracking"])
app.include_router(expenses_router, tags=["Expense Tracking"])
app.include_router(import_router, tags=["CSV Import"])

# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------
@app.get("/", tags=["Root"])
async def root():
    return {
        "name":        API_TITLE,
        "version":     API_VERSION,
        "db_connected": is_db_connected(),
        "model_file":  str(MODEL_PATH),
        "total_endpoints": 60,
        "categories": {
            "detection":     ["predict", "predict_batch", "health"],
            "auth":          ["signup", "login", "logout", "me", "update_profile", "change_password", "user_stats", "delete_account"],
            "history":       ["history", "history_csv", "stats"],
            "feedback":      ["submit", "list", "get_for_prediction", "delete"],
            "diseases":      ["list_all", "info", "treatment", "prevention"],
            "analytics":     ["trends", "comparison", "confidence", "diseases_freq", "summary"],
            "plants":        ["register", "list", "details", "update", "delete", "scan", "history", "stats"],
            "locations":     ["create", "list", "details", "update", "delete", "stats"],
            "treatments":    ["record", "list", "active", "details", "update", "delete", "progress"],
            "notifications": ["send", "list", "unread_count", "mark_read", "delete", "clear"],
            "qr_code":       ["prediction_qr", "plant_qr", "base64_qr"],
            "reports":       ["generate", "list", "download", "delete"],
            "audit":         ["list", "stats", "clear"],
            "weather":       ["log", "list", "correlation", "summary", "delete"],
            "gallery":       ["list", "details", "compare", "stats", "delete"],
            "batch":         ["plants_update", "plants_delete", "plants_tag", "predictions_delete", "export_data"],
            "seasonal":      ["analysis", "monthly", "best_worst"],
            "tags":          ["create", "list", "details", "update", "delete", "add_plants", "remove_plants"],
        },
        "docs": "/docs",
    }
