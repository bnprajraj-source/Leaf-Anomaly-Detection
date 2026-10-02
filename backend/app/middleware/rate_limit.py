"""
Rate Limiting Middleware
=======================
In-memory rate limiter using sliding window algorithm.
Protects API endpoints from abuse.
"""

import time
import logging
from typing import Dict, Tuple
from collections import defaultdict

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.config import RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SECONDS

logger = logging.getLogger(__name__)


class RateLimitStore:
    """In-memory sliding window rate limit store."""

    def __init__(self):
        self._requests: Dict[str, list] = defaultdict(list)

    def _get_client_id(self, request: Request) -> str:
        """Get unique client identifier from IP and optional user ID."""
        forwarded = request.headers.get("X-Forwarded-For")
        ip = forwarded.split(",")[0].strip() if forwarded else request.client.host

        # Try to get user ID from auth header
        auth = request.headers.get("Authorization", "")
        user_id = ""
        if auth.startswith("Bearer "):
            try:
                from jose import jwt
                from app.config import SECRET_KEY
                token = auth.split(" ")[1]
                payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                user_id = payload.get("sub", "")
            except Exception:
                pass

        return f"{ip}:{user_id}" if user_id else ip

    def is_rate_limited(self, client_id: str, max_requests: int, window_seconds: int) -> Tuple[bool, dict]:
        """
        Check if client has exceeded rate limit using sliding window.

        Returns:
            Tuple of (is_limited, info_dict)
        """
        now = time.time()
        window_start = now - window_seconds

        # Clean old requests
        self._requests[client_id] = [
            t for t in self._requests[client_id] if t > window_start
        ]

        current_count = len(self._requests[client_id])
        remaining = max(0, max_requests - current_count)
        is_limited = current_count >= max_requests

        if not is_limited:
            self._requests[client_id].append(now)

        # Calculate reset time
        if self._requests[client_id]:
            oldest = self._requests[client_id][0]
            reset_at = oldest + window_seconds
        else:
            reset_at = now + window_seconds

        info = {
            "limit": max_requests,
            "remaining": remaining,
            "reset_at": int(reset_at),
            "window_seconds": window_seconds,
        }

        return is_limited, info

    def cleanup(self, max_age: int = 3600):
        """Remove entries older than max_age seconds."""
        now = time.time()
        expired = [k for k, v in self._requests.items() if not v or v[-1] < now - max_age]
        for k in expired:
            del self._requests[k]


# Global store instance
_store = RateLimitStore()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware.

    Applies different limits based on endpoint type:
    - Auth endpoints: 10 requests/minute (stricter)
    - Prediction endpoints: 30 requests/minute
    - General API: 60 requests/minute
    """

    # Custom limits per path prefix (falls back to default)
    PATH_LIMITS = {
        "/auth/login": (10, 60),
        "/auth/signup": (10, 60),
        "/predict": (30, 60),
        "/feedback": (20, 60),
    }

    def __init__(self, app, default_limit: int = None, default_window: int = None):
        super().__init__(app)
        self.default_limit = default_limit or RATE_LIMIT_REQUESTS
        self.default_window = default_window or RATE_LIMIT_WINDOW_SECONDS

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for docs, health, and static files
        path = request.url.path
        if path in ("/docs", "/redoc", "/openapi.json", "/health", "/"):
            return await call_next(request)

        # Skip for WebSocket or internal
        if path.startswith("/ws") or path.startswith("/internal"):
            return await call_next(request)

        client_id = _store._get_client_id(request)

        # Get limit for this path
        limit, window = self.default_limit, self.default_window
        for prefix, (l, w) in self.PATH_LIMITS.items():
            if path.startswith(prefix):
                limit, window = l, w
                break

        is_limited, info = _store.is_rate_limited(client_id, limit, window)

        if is_limited:
            logger.warning(f"Rate limit exceeded for {client_id} on {path}")
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Please try again later.",
                    "retry_after_seconds": info["window_seconds"],
                },
                headers={
                    "X-RateLimit-Limit": str(info["limit"]),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(info["reset_at"]),
                    "Retry-After": str(info["window_seconds"]),
                },
            )

        response = await call_next(request)

        # Add rate limit headers to response
        response.headers["X-RateLimit-Limit"] = str(info["limit"])
        response.headers["X-RateLimit-Remaining"] = str(info["remaining"])
        response.headers["X-RateLimit-Reset"] = str(info["reset_at"])

        return response


def get_rate_limit_status(request: Request) -> dict:
    """Get current rate limit status for the requesting client."""
    client_id = _store._get_client_id(request)
    limit = RATE_LIMIT_REQUESTS
    window = RATE_LIMIT_WINDOW_SECONDS

    now = time.time()
    window_start = now - window
    recent = [t for t in _store._requests.get(client_id, []) if t > window_start]

    return {
        "limit": limit,
        "remaining": max(0, limit - len(recent)),
        "window_seconds": window,
        "reset_at": int(recent[0] + window) if recent else int(now + window),
    }
