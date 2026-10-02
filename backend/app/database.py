"""
MongoDB Database Connection
============================
Async MongoDB driver using Motor for the Leaf Anomaly Detection API.
Provides connection pooling, auto-reconnection, and database access.
"""

import asyncio
import logging
from typing import Optional

import motor.motor_asyncio
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import MONGODB_URL, MONGODB_DB_NAME

logger = logging.getLogger(__name__)

_client: Optional[AsyncIOMotorClient] = None
_database: Optional[AsyncIOMotorDatabase] = None
_connected: bool = False
_reconnect_task: Optional[asyncio.Task] = None

# Reconnection settings
RECONNECT_INTERVAL_SECONDS = 10
MAX_RECONNECT_ATTEMPTS = 0  # 0 = infinite retries
SERVER_SELECTION_TIMEOUT_MS = 5000


async def _try_connect() -> bool:
    """Attempt to connect to MongoDB. Returns True on success."""
    global _client, _database, _connected
    try:
        _client = AsyncIOMotorClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=SERVER_SELECTION_TIMEOUT_MS,
            maxPoolSize=10,
            minPoolSize=2,
        )
        # Verify connection
        await _client.admin.command("ping")
        _database = _client[MONGODB_DB_NAME]
        _connected = True
        logger.info(f"Connected to MongoDB: {MONGODB_DB_NAME}")
        return True
    except Exception as e:
        _connected = False
        _client = None
        _database = None
        logger.debug(f"MongoDB connection attempt failed: {e}")
        return False


async def _reconnect_loop() -> None:
    """Background task that periodically tries to reconnect to MongoDB."""
    global _connected
    attempts = 0
    while True:
        await asyncio.sleep(RECONNECT_INTERVAL_SECONDS)
        if _connected:
            # Already connected — verify with a ping
            try:
                if _client:
                    await _client.admin.command("ping")
                continue
            except Exception:
                _connected = False
                logger.warning("MongoDB connection lost. Attempting to reconnect...")

        attempts += 1
        if MAX_RECONNECT_ATTEMPTS > 0 and attempts > MAX_RECONNECT_ATTEMPTS:
            logger.error("Max reconnection attempts reached. Giving up.")
            break

        logger.info(f"Attempting to reconnect to MongoDB (attempt {attempts})...")
        if await _try_connect():
            logger.info("Successfully reconnected to MongoDB!")
            attempts = 0


async def connect_db() -> None:
    """
    Establish connection to MongoDB using Motor async driver.
    Called once during application startup.
    Starts a background reconnection loop if initial connection fails.
    """
    global _reconnect_task

    if await _try_connect():
        logger.info("MongoDB is ready.")
    else:
        logger.warning("MongoDB not available on startup. Running without database.")
        logger.warning(f"Will retry every {RECONNECT_INTERVAL_SECONDS}s in background.")

    # Start background reconnection task (runs even if already connected,
    # to detect and recover from future disconnections)
    if _reconnect_task is None or _reconnect_task.done():
        _reconnect_task = asyncio.create_task(_reconnect_loop())
        logger.info("Background MongoDB reconnection monitor started.")


async def close_db() -> None:
    """Close MongoDB connection and stop reconnection task on shutdown."""
    global _client, _database, _connected, _reconnect_task

    # Cancel reconnection task
    if _reconnect_task and not _reconnect_task.done():
        _reconnect_task.cancel()
        try:
            await _reconnect_task
        except asyncio.CancelledError:
            pass
        _reconnect_task = None

    if _client:
        _client.close()
        _client = None
        _database = None
        _connected = False
        logger.info("MongoDB connection closed")


def is_db_connected() -> bool:
    """Check if MongoDB is currently connected."""
    return _connected and _database is not None


def get_database() -> Optional[AsyncIOMotorDatabase]:
    """
    Get the database instance.
    Returns None if not connected (instead of raising).
    """
    if not is_db_connected():
        return None
    return _database


def get_client() -> Optional[AsyncIOMotorClient]:
    """Get the Motor client instance."""
    if not is_db_connected():
        return None
    return _client


# Collection names
PREDICTIONS_COLLECTION = "predictions"
STATS_COLLECTION = "stats"
USERS_COLLECTION = "users"
FEEDBACK_COLLECTION = "feedback"
BLACKLIST_COLLECTION = "token_blacklist"
PLANTS_COLLECTION = "plants"
LOCATIONS_COLLECTION = "locations"
TREATMENTS_COLLECTION = "treatments"
NOTIFICATIONS_COLLECTION = "notifications"
REPORTS_COLLECTION = "reports"
AUDIT_LOG_COLLECTION = "audit_log"
WEATHER_COLLECTION = "weather_logs"
GALLERY_COLLECTION = "image_gallery"
TAGS_COLLECTION = "tags"
GROWTH_STAGES_COLLECTION = "growth_stages"
IRRIGATION_COLLECTION = "irrigation_logs"
FERTILIZER_COLLECTION = "fertilizer_logs"
SOIL_COLLECTION = "soil_logs"
HARVEST_COLLECTION = "harvest_logs"
EXPENSES_COLLECTION = "expenses"
