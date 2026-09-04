"""
Database Models / Schemas
==========================
Pydantic models for MongoDB documents related to prediction history.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class PredictionRecord(BaseModel):
    """
    MongoDB document schema for a prediction record.
    Stored in the 'predictions' collection.
    """
    id: Optional[str] = Field(None, alias="_id")
    prediction: str = Field(..., description="Healthy or Diseased")
    confidence: float = Field(..., ge=0, le=100)
    anomaly_type: str = Field(..., description="Specific disease class")
    all_scores: Dict[str, float] = Field(default_factory=dict)
    processing_time_ms: float = Field(default=0.0)
    image_meta: Dict[str, Any] = Field(default_factory=dict)
    attention_map_available: bool = Field(default=False)
    filename: Optional[str] = Field(None, description="Original uploaded filename")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_agent: Optional[str] = Field(None)

    class Config:
        populate_by_name = True


class PredictionRecordCreate(BaseModel):
    """Schema for creating a new prediction record (without _id)."""
    prediction: str
    confidence: float
    anomaly_type: str
    all_scores: Dict[str, float] = {}
    processing_time_ms: float = 0.0
    image_meta: Dict[str, Any] = {}
    attention_map_available: bool = False
    filename: Optional[str] = None
    user_agent: Optional[str] = None


class StatsRecord(BaseModel):
    """Schema for aggregated statistics."""
    total_predictions: int = 0
    healthy_count: int = 0
    diseased_count: int = 0
    disease_counts: Dict[str, int] = {}
    avg_confidence: float = 0.0
    avg_processing_time_ms: float = 0.0
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PaginatedResponse(BaseModel):
    """Generic paginated response wrapper."""
    items: list = []
    total: int = 0
    page: int = 1
    per_page: int = 20
    total_pages: int = 0


# --- Auth / User Models ---

class UserCreate(BaseModel):
    """Schema for user registration."""
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password (min 6 chars)")
    full_name: Optional[str] = Field(None, description="User full name")


class UserLogin(BaseModel):
    """Schema for user login."""
    email: str
    password: str


class User(BaseModel):
    """MongoDB document schema for a user."""
    id: Optional[str] = Field(None, alias="_id")
    email: str
    full_name: Optional[str] = None
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True


class UserResponse(BaseModel):
    """Schema for user data returned to client (no password)."""
    id: Optional[str] = Field(None, alias="_id")
    email: str
    full_name: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
