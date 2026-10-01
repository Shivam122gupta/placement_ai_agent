import time
import logging
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger("app.security.rate_limiter")


class SlidingWindowRateLimiter:
    """
    High-performance in-memory sliding-window rate limiter.
    Maintains clean bounded timestamp lists with auto-eviction.
    """

    def __init__(self):
        # Map: key -> list of float timestamps
        self._store: Dict[str, List[float]] = defaultdict(list)
        self._last_cleanup = time.time()

    def _cleanup_stale_keys(self, current_time: float, max_window: float = 300.0):
        """Evicts keys that haven't had activity in max_window seconds."""
        if current_time - self._last_cleanup < 60.0:
            return
        self._last_cleanup = current_time
        stale_keys = []
        for key, timestamps in self._store.items():
            valid = [ts for ts in timestamps if current_time - ts <= max_window]
            if not valid:
                stale_keys.append(key)
            else:
                self._store[key] = valid
        for key in stale_keys:
            del self._store[key]

    def is_allowed(
        self,
        key: str,
        max_requests: int,
        window_seconds: int,
    ) -> Tuple[bool, int, int]:
        """
        Evaluates whether a request with the given key is allowed within the sliding window.
        Returns: (is_allowed, remaining_requests, retry_after_seconds)
        """
        now = time.time()
        self._cleanup_stale_keys(now, float(window_seconds))

        timestamps = self._store[key]
        cutoff = now - window_seconds
        # Filter to timestamps within window
        valid_timestamps = [ts for ts in timestamps if ts > cutoff]
        self._store[key] = valid_timestamps

        current_count = len(valid_timestamps)
        if current_count >= max_requests:
            oldest_timestamp = valid_timestamps[0]
            retry_after = max(1, int(window_seconds - (now - oldest_timestamp)))
            return False, 0, retry_after

        # Record this request
        valid_timestamps.append(now)
        remaining = max_requests - len(valid_timestamps)
        return True, remaining, 0


# Singleton instance
rate_limiter = SlidingWindowRateLimiter()


def get_client_ip(request: Request) -> str:
    """Extracts client IP address safely considering reverse proxies like Cloudflare or Render."""
    # 1. Cloudflare header
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()

    # 2. X-Forwarded-For header
    x_forwarded = request.headers.get("X-Forwarded-For")
    if x_forwarded:
        ips = [ip.strip() for ip in x_forwarded.split(",")]
        if ips:
            return ips[0]

    # 3. X-Real-IP header
    x_real = request.headers.get("X-Real-IP")
    if x_real:
        return x_real.strip()

    # 4. Fallback to client host
    if request.client and request.client.host:
        return request.client.host

    return "127.0.0.1"


# Route-specific rate limit rules: path prefix -> (max_requests, window_seconds)
ROUTE_LIMITS: List[Tuple[str, int, int]] = [
    ("/api/v1/auth/login", 10, 60),               # 10 attempts / min
    ("/api/v1/auth/register", 6, 60),              # 6 registrations / min
    ("/api/v1/auth/resend-verification", 3, 300),  # 3 resends / 5 min
    ("/api/v1/agent/chat", 30, 60),                # 30 agent turns / min
    ("/api/v1/resumes/upload", 15, 60),            # 15 uploads / min
]

GLOBAL_LIMIT = (180, 60)  # 180 requests / min default for other routes


class RateLimiterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path

        # Ignore OPTIONS preflight, static assets, docs, and health checks from strict rate limits
        if request.method == "OPTIONS" or path.startswith("/docs") or path.startswith("/openapi") or path.startswith("/redoc") or path == "/health" or path == "/":
            return await call_next(request)

        # In testing environment or unit tests, allow high throughput
        if getattr(request.app.state, "disable_rate_limiting", False):
            return await call_next(request)

        client_ip = get_client_ip(request)

        # Determine limit for path
        max_requests, window = GLOBAL_LIMIT
        limit_name = "global"
        for prefix, limit_count, limit_window in ROUTE_LIMITS:
            if path.startswith(prefix):
                max_requests = limit_count
                window = limit_window
                limit_name = prefix
                break

        limiter_key = f"{client_ip}:{limit_name}"
        allowed, remaining, retry_after = rate_limiter.is_allowed(
            key=limiter_key,
            max_requests=max_requests,
            window_seconds=window,
        )

        if not allowed:
            logger.warning(
                f"Rate limit exceeded for IP {client_ip} on path {path}. "
                f"Limit: {max_requests}/{window}s. Retry after: {retry_after}s."
            )
            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Too many requests. Please wait {retry_after} seconds before trying again.",
                        "retry_after_seconds": retry_after,
                    }
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(retry_after),
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
