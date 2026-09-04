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
from app.database import (
    connect_db, close_db, is_db_connected, get_database,
    USERS_COLLECTION, PREDICTIONS_COLLECTION
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
        # Users: unique index on email
        await db[USERS_COLLECTION].create_index("email", unique=True)
        # Predictions: indexes for common queries
        await db[PREDICTIONS_COLLECTION].create_index("created_at")
        await db[PREDICTIONS_COLLECTION].create_index("prediction")
        await db[PREDICTIONS_COLLECTION].create_index("anomaly_type")
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
# Routers
# ---------------------------------------------------------------------------
app.include_router(prediction_router, tags=["Detection"])
app.include_router(history_router, tags=["History & Stats"])
app.include_router(auth_router, tags=["Auth"])

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
        "endpoints": {
            "docs":     "/docs",
            "health":   "GET  /health",
            "predict":  "POST /predict",
            "history":  "GET  /history",
            "stats":    "GET  /stats",
            "signup":   "POST /auth/signup",
            "login":    "POST /auth/login",
            "me":       "GET  /auth/me",
        },
    }
