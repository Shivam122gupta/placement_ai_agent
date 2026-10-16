import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request
from app.core.exceptions import RateLimitExceededError
import logging

from app.core.rate_limiter import get_client_ip

logger = logging.getLogger("app.rate_limit")

# In-memory sliding-window store: key -> list of timestamps
_memory_store: Dict[str, List[float]] = defaultdict(list)


def _get_client_identifier(request: Request) -> str:
    """Extract client IP safely considering reverse proxies and anti-spoofing."""
    return get_client_ip(request)


def rate_limit(requests_limit: int = 10, window_seconds: int = 60, key_prefix: str = "endpoint"):
    """
    FastAPI dependency for sliding-window rate limiting.
    Usage:
        @router.post("/login", dependencies=[Depends(rate_limit(requests_limit=5, window_seconds=60))])
    """
    async def dependency(request: Request):
        if getattr(request.app.state, "disable_rate_limiting", False):
            return
        client_ip = _get_client_identifier(request)
        key = f"{key_prefix}:{request.url.path}:{client_ip}"
        now = time.time()
        cutoff = now - window_seconds

        # Clean timestamps older than window
        timestamps = [ts for ts in _memory_store[key] if ts > cutoff]
        _memory_store[key] = timestamps

        if len(timestamps) >= requests_limit:
            retry_after = int(window_seconds - (now - timestamps[0])) if timestamps else window_seconds
            logger.warning(f"Rate limit exceeded for client {client_ip} on {request.url.path}. Limit: {requests_limit}/{window_seconds}s")
            raise RateLimitExceededError(
                message=f"Too many requests. Please try again in {max(1, retry_after)} seconds.",
                code="TOO_MANY_REQUESTS"
            )

        # Record this request
        _memory_store[key].append(now)

    return dependency
