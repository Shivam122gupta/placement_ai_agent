import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import RedirectResponse

from app.core.config import settings

logger = logging.getLogger("app.security.https")


class HTTPSEnforcementMiddleware(BaseHTTPMiddleware):
    """
    Production-grade HTTPS Enforcement and Security Headers Middleware.
    - Redirects insecure HTTP requests to HTTPS in production environments.
    - Honors X-Forwarded-Proto from cloud load balancers and reverse proxies (AWS ALB, Cloudflare, Render, Nginx).
    - Enforces Strict-Transport-Security (HSTS) with includeSubDomains and preload.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Determine if HTTPS should be enforced
        is_production = getattr(settings, "ENVIRONMENT", "production") == "production"
        enforce_https = getattr(settings, "ENFORCE_HTTPS", is_production)

        if enforce_https:
            # Check protocol from proxy header or direct URL scheme
            forwarded_proto = request.headers.get("X-Forwarded-Proto", "").lower().strip()
            scheme = forwarded_proto if forwarded_proto else request.url.scheme

            path = request.url.path
            # Exclude local health monitoring loopback or internal non-browser endpoints if needed
            is_exempt = path in ["/health", "/ready"] and request.headers.get("Host", "").startswith("localhost")

            if scheme == "http" and not is_exempt:
                # Build canonical HTTPS target URL
                https_url = str(request.url).replace("http://", "https://", 1)
                logger.info(f"Redirecting insecure HTTP request to HTTPS: {request.url.path}")
                return RedirectResponse(url=https_url, status_code=301)

        response = await call_next(request)

        # Enterprise Strict-Transport-Security header (1 year, include subdomains, preload eligibility)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        return response
