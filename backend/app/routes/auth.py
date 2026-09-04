"""
Authentication Routes
=====================
Signup, Login, and User Profile endpoints.
"""

import logging
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from app.config import SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_database, USERS_COLLECTION
from app.db_models import UserCreate, UserLogin, User, UserResponse, Token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Auth"])

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

ALGORITHM = "HS256"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Dependency to extract and validate the current user from JWT."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        user = await db[USERS_COLLECTION].find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise credentials_exception
    if user is None:
        raise credentials_exception
    return user


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate):
    """Register a new user account."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available. Please start MongoDB on port 27017.")

    # Ensure unique index on email
    try:
        await db[USERS_COLLECTION].create_index("email", unique=True)
    except Exception:
        pass  # Index may already exist

    # Check if user already exists
    existing = await db[USERS_COLLECTION].find_one({"email": user_data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user document
    user_doc = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": hash_password(user_data.password),
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
    }

    try:
        result = await db[USERS_COLLECTION].insert_one(user_doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    except Exception as e:
        logger.error(f"Failed to create user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user account"
        )

    # Create access token
    access_token = create_access_token(data={"sub": str(result.inserted_id)})

    user_response = UserResponse(
        id=str(result.inserted_id),
        email=user_doc["email"],
        full_name=user_doc["full_name"],
        is_active=user_doc["is_active"],
        created_at=user_doc["created_at"],
    )

    logger.info(f"New user registered: {user_data.email}")
    return Token(access_token=access_token, user=user_response)


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Authenticate user and return JWT token."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available. Please start MongoDB on port 27017.")

    user = await db[USERS_COLLECTION].find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    access_token = create_access_token(data={"sub": str(user["_id"])})

    user_response = UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        full_name=user.get("full_name"),
        is_active=user.get("is_active", True),
        created_at=user.get("created_at", datetime.now(timezone.utc)),
    )

    logger.info(f"User logged in: {credentials.email}")
    return Token(access_token=access_token, user=user_response)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        full_name=current_user.get("full_name"),
        is_active=current_user.get("is_active", True),
        created_at=current_user.get("created_at", datetime.now(timezone.utc)),
    )
