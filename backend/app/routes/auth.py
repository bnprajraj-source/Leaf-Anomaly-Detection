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
from app.database import get_database, USERS_COLLECTION, PREDICTIONS_COLLECTION, BLACKLIST_COLLECTION
from app.db_models import UserCreate, UserLogin, User, UserResponse, Token, ProfileUpdate, PasswordChange

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


# ---------------------------------------------------------------------------
# PUT /auth/update-profile — Update user profile
# ---------------------------------------------------------------------------
@router.put("/update-profile", response_model=UserResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update the current user's profile (full_name and/or email)."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    update_fields = {}
    if profile_data.full_name is not None:
        update_fields["full_name"] = profile_data.full_name
    if profile_data.email is not None:
        # Check if email is already taken by another user
        existing = await db[USERS_COLLECTION].find_one({
            "email": profile_data.email,
            "_id": {"$ne": current_user["_id"]},
        })
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered by another user"
            )
        update_fields["email"] = profile_data.email

    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    try:
        await db[USERS_COLLECTION].update_one(
            {"_id": current_user["_id"]},
            {"$set": update_fields}
        )
    except Exception as e:
        logger.error(f"Failed to update profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )

    # Fetch updated user
    updated_user = await db[USERS_COLLECTION].find_one({"_id": current_user["_id"]})
    logger.info(f"Profile updated for user: {current_user['email']}")

    return UserResponse(
        id=str(updated_user["_id"]),
        email=updated_user["email"],
        full_name=updated_user.get("full_name"),
        is_active=updated_user.get("is_active", True),
        created_at=updated_user.get("created_at", datetime.now(timezone.utc)),
    )


# ---------------------------------------------------------------------------
# PUT /auth/change-password — Change user password
# ---------------------------------------------------------------------------
@router.put("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: dict = Depends(get_current_user),
):
    """Change the current user's password after verifying the current password."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    # Verify current password
    if not verify_password(password_data.current_password, current_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )

    # Hash new password and update
    new_hashed = hash_password(password_data.new_password)
    try:
        await db[USERS_COLLECTION].update_one(
            {"_id": current_user["_id"]},
            {"$set": {"hashed_password": new_hashed}}
        )
    except Exception as e:
        logger.error(f"Failed to change password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )

    logger.info(f"Password changed for user: {current_user['email']}")
    return {"message": "Password changed successfully"}


# ---------------------------------------------------------------------------
# POST /auth/logout — Logout and blacklist token
# ---------------------------------------------------------------------------
@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user), token: str = Depends(oauth2_scheme)):
    """Logout by blacklisting the current JWT token."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp = payload.get("exp")
        if exp:
            from datetime import datetime
            expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)
            await db[BLACKLIST_COLLECTION].insert_one({
                "token": token,
                "user_id": str(current_user["_id"]),
                "expires_at": expires_at,
                "created_at": datetime.now(timezone.utc),
            })
    except Exception as e:
        logger.warning(f"Failed to blacklist token: {e}")

    logger.info(f"User logged out: {current_user['email']}")
    return {"message": "Logged out successfully"}


# ---------------------------------------------------------------------------
# DELETE /auth/delete-account — Delete user account and all associated data
# ---------------------------------------------------------------------------
@router.delete("/delete-account")
async def delete_account(
    password: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete the current user's account and all associated prediction history."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    # Verify password before deletion
    if not verify_password(password, current_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password is incorrect"
        )

    user_id = current_user["_id"]

    try:
        # Delete user's predictions
        await db[PREDICTIONS_COLLECTION].delete_many({"user_id": str(user_id)})
        # Delete user's feedback
        await db["feedback"].delete_many({"user_id": str(user_id)})
        # Delete token blacklists for this user
        await db[BLACKLIST_COLLECTION].delete_many({"user_id": str(user_id)})
        # Delete the user
        await db[USERS_COLLECTION].delete_one({"_id": user_id})
    except Exception as e:
        logger.error(f"Failed to delete account: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account"
        )

    logger.info(f"Account deleted for user: {current_user['email']}")
    return {"message": "Account deleted successfully"}


# ---------------------------------------------------------------------------
# GET /auth/user-stats — Get prediction statistics for current user
# ---------------------------------------------------------------------------
@router.get("/user-stats")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    """Get prediction statistics specific to the current user."""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    user_id = str(current_user["_id"])
    collection = db[PREDICTIONS_COLLECTION]

    try:
        total = await collection.count_documents({"user_id": user_id})
    except Exception as e:
        logger.error(f"Failed to count user predictions: {e}")
        return {
            "total_predictions": 0,
            "healthy_count": 0,
            "diseased_count": 0,
            "disease_counts": {},
            "avg_confidence": 0.0,
            "recent_predictions": [],
        }

    if total == 0:
        return {
            "total_predictions": 0,
            "healthy_count": 0,
            "diseased_count": 0,
            "disease_counts": {},
            "avg_confidence": 0.0,
            "recent_predictions": [],
        }

    try:
        pipeline = [
            {"$match": {"user_id": user_id}},
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": 1},
                    "healthy_count": {
                        "$sum": {"$cond": [{"$eq": ["$prediction", "Healthy"]}, 1, 0]}
                    },
                    "diseased_count": {
                        "$sum": {"$cond": [{"$eq": ["$prediction", "Diseased"]}, 1, 0]}
                    },
                    "avg_confidence": {"$avg": "$confidence"},
                }
            },
        ]
        agg_result = await collection.aggregate(pipeline).to_list(1)
        stats = agg_result[0] if agg_result else {}

        disease_pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": "$anomaly_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        disease_docs = await collection.aggregate(disease_pipeline).to_list(50)
        disease_counts = {doc["_id"]: doc["count"] for doc in disease_docs}

        from app.routes.history import serialize_doc
        recent_cursor = collection.find({"user_id": user_id}).sort("created_at", -1).limit(5)
        recent = []
        async for doc in recent_cursor:
            recent.append(serialize_doc(doc))

        return {
            "total_predictions": stats.get("total", 0),
            "healthy_count": stats.get("healthy_count", 0),
            "diseased_count": stats.get("diseased_count", 0),
            "disease_counts": disease_counts,
            "avg_confidence": round(stats.get("avg_confidence", 0), 2),
            "recent_predictions": recent,
        }
    except Exception as e:
        logger.error(f"Failed to compute user stats: {e}")
        return {
            "total_predictions": 0,
            "healthy_count": 0,
            "diseased_count": 0,
            "disease_counts": {},
            "avg_confidence": 0.0,
            "recent_predictions": [],
        }
