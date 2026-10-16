import time
import logging
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.security_logger import security_logger, SecurityEventType

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


import hashlib
from typing import Dict, List, Tuple, Optional


def check_login_email_rate_limit(email: str, max_attempts: int = 5, window_seconds: int = 300) -> Tuple[bool, int]:
    """
    Throttles repeated login attempts on the same target email across all IPs
    to prevent distributed brute-force or credential stuffing attacks.
    Returns: (is_allowed, retry_after_seconds)
    """
    clean_email = email.strip().lower()
    key = f"email_login:{clean_email}"
    allowed, remaining, retry_after = rate_limiter.is_allowed(
        key=key,
        max_requests=max_attempts,
        window_seconds=window_seconds,
    )
    return allowed, retry_after


# Route-specific rate limit rules:
# Tuple: (path_prefix, method_filter, max_requests, window_seconds, is_ai)
# method_filter: Optional HTTP method ("POST", "GET", None = any)
ROUTE_LIMITS: List[Tuple[str, Optional[str], int, int, bool]] = [
    # 1. Critical DB Operations
    ("/api/v1/admin/db/cleanup", "POST", 2, 600, False),         # Strict: 2 DB wipes / 10 min

    # 2. Authentication & Account Creation
    ("/api/v1/auth/login", "POST", 5, 60, False),                # 5 login attempts / min per IP
    ("/api/v1/auth/register", "POST", 3, 300, False),            # Strict: 3 account creations / 5 min per IP
    ("/api/v1/auth/resend-verification", "POST", 3, 300, False), # 3 resends / 5 min
    ("/api/v1/auth/forgot-password", "POST", 3, 300, False),     # 3 password reset requests / 5 min
    ("/api/v1/auth/reset-password", "POST", 3, 300, False),      # 3 password resets / 5 min
    ("/api/v1/auth/verify-email", "POST", 10, 60, False),        # 10 email verify attempts / min

    # 3. AI Generation Requests (Expensive LLM / Reasoning Loops)
    ("/api/v1/agent/chat", "POST", 10, 60, True),                # 10 Copilot AI turns / min
    ("/api/v1/agent/confirm-action", "POST", 20, 60, True),      # 20 Copilot action executions / min
    ("/api/v1/interviews/generate", "POST", 5, 300, True),       # 5 AI Mock Interview generations / 5 min
    ("/api/v1/interviews", "POST", 15, 300, True),               # 15 AI answer evaluations / 5 min
    ("/api/v1/skill-gaps/generate", "POST", 5, 300, True),       # 5 AI Learning Roadmap generations / 5 min
    ("/api/v1/matching/jobs", "POST", 10, 300, True),            # 10 AI Job Matches / 5 min
    ("/api/v1/jobs/analyze-jd", "POST", 5, 300, True),           # 5 AI Job Description analyses / 5 min
    ("/api/v1/resumes", "POST", 5, 300, True),                   # 5 AI Resume parses / 5 min

    # 4. Anti-Scraping Data Listing & Search Endpoints
    ("/api/v1/jobs/search", "POST", 20, 60, False),              # 20 searches / min
    ("/api/v1/jobs", "GET", 30, 60, False),                      # 30 job listings / min
    ("/api/v1/admin/users", "GET", 20, 60, False),               # 20 admin user queries / min
    ("/api/v1/admin/stats", "GET", 60, 60, False),               # 60 stats queries / min
    ("/api/v1/admin", None, 45, 60, False),                      # 45 general admin calls / min
]

GLOBAL_AUTHENTICATED_LIMIT = (120, 60)   # 120 req / min for logged-in users
GLOBAL_ANONYMOUS_LIMIT = (60, 60)        # 60 req / min for anonymous visitors


class RateLimiterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        method = request.method

        # Ignore OPTIONS preflight, static assets, docs, and health checks
        if method == "OPTIONS" or path.startswith(("/docs", "/openapi", "/redoc", "/favicon")) or path in ("/health", "/"):
            return await call_next(request)

        # In testing environment or unit tests, allow high throughput unless explicitly testing rate limiting
        if getattr(request.app.state, "disable_rate_limiting", False) and not request.headers.get("X-Test-Rate-Limit"):
            return await call_next(request)

        client_ip = get_client_ip(request)

        # Determine user identifier:
        # For authenticated calls, use bearer token hash to avoid shared-IP collateral blocking.
        # For auth endpoints (login, register), strictly key on client IP.
        auth_header = request.headers.get("Authorization")
        is_auth_route = path.startswith("/api/v1/auth/")
        if auth_header and auth_header.startswith("Bearer ") and not is_auth_route:
            token_val = auth_header[7:].strip()
            token_hash = hashlib.sha256(token_val.encode()).hexdigest()[:16]
            client_identifier = f"user:{token_hash}"
            max_requests, window = GLOBAL_AUTHENTICATED_LIMIT
        else:
            client_identifier = f"ip:{client_ip}"
            max_requests, window = GLOBAL_ANONYMOUS_LIMIT

        is_ai_route = False
        limit_name = "global"

        for prefix, method_filter, limit_count, limit_window, is_ai in ROUTE_LIMITS:
            if path.startswith(prefix) and (method_filter is None or method == method_filter):
                max_requests = limit_count
                window = limit_window
                is_ai_route = is_ai
                limit_name = f"{method or '*'}:{prefix}"
                break

        limiter_key = f"{client_identifier}:{limit_name}"
        allowed, remaining, retry_after = rate_limiter.is_allowed(
            key=limiter_key,
            max_requests=max_requests,
            window_seconds=window,
        )

        if not allowed:
            event_type = SecurityEventType.AI_RATE_LIMIT_EXCEEDED if is_ai_route else SecurityEventType.RATE_LIMIT_EXCEEDED
            error_code = "AI_RATE_LIMIT_EXCEEDED" if is_ai_route else "RATE_LIMIT_EXCEEDED"
            error_msg = (
                f"AI generation limit reached. To prevent abuse and model overload, please wait {retry_after} seconds before requesting more AI generations."
                if is_ai_route
                else f"Too many requests. Please wait {retry_after} seconds before trying again."
            )

            logger.warning(
                f"Rate limit exceeded for {client_identifier} on {method} {path}. "
                f"Limit: {max_requests}/{window}s. Retry after: {retry_after}s. is_ai={is_ai_route}"
            )
            security_logger.log_event(
                event_type=event_type,
                severity="WARNING",
                client_ip=client_ip,
                user_agent=request.headers.get("User-Agent"),
                endpoint=path,
                method=method,
                details={
                    "identifier": client_identifier,
                    "limit": max_requests,
                    "window_seconds": window,
                    "retry_after_seconds": retry_after,
                    "is_ai_route": is_ai_route,
                },
            )
            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "code": error_code,
                        "message": error_msg,
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
