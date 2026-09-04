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
CORS_ORIGINS     = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# MongoDB settings
MONGODB_URL      = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB_NAME  = os.getenv("MONGODB_DB_NAME", "leaf_anomaly_detection")

# Auth settings
SECRET_KEY                = os.getenv("SECRET_KEY", "leaf-anomaly-detection-secret-key-change-in-production")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
