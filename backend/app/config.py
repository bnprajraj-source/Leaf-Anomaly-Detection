"""Application configuration and constants."""
import logging
import os
from pathlib import Path

from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load .env file from the backend directory (same directory as this config file)
_backend_dir = Path(__file__).resolve().parent.parent
_env_path = _backend_dir / ".env"
if _env_path.exists():
    load_dotenv(_env_path)
    logger.info(f"Loaded .env from {_env_path}")
else:
    load_dotenv()  # fallback: search current directory and parents
    logger.warning(f".env not found at {_env_path}, using environment variables.")


def _normalize_base_url(value: str | None, default: str) -> str:
    """Return a clean base URL without a trailing slash."""
    candidate = (value or default).strip()
    if not candidate:
        candidate = default
    return candidate.rstrip("/")


def _parse_origin_list(raw_value: str | None) -> list[str]:
    """Parse a comma/semicolon-separated list of origins into a clean list."""
    if raw_value is None:
        return []
    origins = []
    for item in raw_value.replace(";", ",").split(","):
        candidate = item.strip()
        if candidate:
            origins.append(_normalize_base_url(candidate, "http://localhost:3000"))
    return origins


APP_ENV = os.getenv("APP_ENV", "development").lower()
PORT = int(os.getenv("PORT", "8000"))
FRONTEND_URL = _normalize_base_url(
    os.getenv("FRONTEND_URL") or os.getenv("APP_PUBLIC_URL"),
    "http://localhost:3000",
)
BACKEND_URL = _normalize_base_url(
    os.getenv("BACKEND_URL") or os.getenv("APP_URL") or f"http://localhost:{PORT}",
    "http://localhost:8000",
)

# Paths
BASE_DIR         = _backend_dir
SAVED_MODELS_DIR = BASE_DIR / "saved_models"
DATASET_DIR      = BASE_DIR / "dataset"

# Ensure directories exist
SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
DATASET_DIR.mkdir(parents=True, exist_ok=True)

# Model settings
MODEL_PATH       = SAVED_MODELS_DIR / "leaf_detection_model.pth"
NUM_CLASSES      = 5
IMAGE_SIZE       = (224, 224)
DEVICE           = "cpu"   # change to "cuda" if GPU is available

# ImageNet normalization stats
IMAGENET_MEAN    = [0.485, 0.456, 0.406]
IMAGENET_STD     = [0.229, 0.224, 0.225]

# Class labels
CLASS_LABELS = [
    "Healthy",
    "Leaf Spot",
    "Powdery Mildew",
    "Rust",
    "Blight",
]

# API settings
API_TITLE        = "Leaf Anomaly Detection API"
API_VERSION      = "1.0.0"
API_DESCRIPTION  = "AI-powered leaf disease detection using Attention Mechanism and Meta-Learning"

CORS_ORIGINS = _parse_origin_list(os.getenv("CORS_ORIGINS"))
if not CORS_ORIGINS:
    CORS_ORIGINS = [
        FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        BACKEND_URL,
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
CORS_ORIGINS = list(dict.fromkeys(origin.rstrip("/") for origin in CORS_ORIGINS if origin))

# MongoDB settings
MONGODB_URL      = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB_NAME  = os.getenv("MONGODB_DB_NAME", "leaf_anomaly_detection")

# Auth settings
SECRET_KEY                = os.getenv("SECRET_KEY", "leaf-anomaly-detection-secret-key-change-in-production")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Email settings (SMTP)
SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM     = os.getenv("SMTP_FROM", "noreply@leafanomaly.com")
SMTP_USE_TLS  = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

# Rate limiting
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "60"))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
