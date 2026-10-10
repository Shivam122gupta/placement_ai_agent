import uuid
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.exceptions import AppException
from app.core.rate_limiter import RateLimiterMiddleware
from app.core.compression import CompressionMiddleware
from app.core.error_handlers import (
    app_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    unhandled_exception_handler,
)
from app.db.session import init_db, close_db
from app.api.v1.api_router import api_v1_router

logger = setup_logging()


import asyncio
from app.services.session_cleanup import start_periodic_session_cleanup


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} in [{settings.ENVIRONMENT}] mode...")
    cleanup_task = None
    try:
        await init_db()
        cleanup_task = asyncio.create_task(start_periodic_session_cleanup(300))
    except Exception as e:
        logger.error(f"Failed to initialize database during startup: {e}")
    try:
        from app.rag.qdrant_client import ensure_collections
        ensure_collections()
    except Exception as qe:
        logger.warning(f"Qdrant collection initialization notice: {qe}")
    yield
    logger.info("Shutting down application...")
    if cleanup_task:
        cleanup_task.cancel()
    await close_db()


_is_prod = settings.ENVIRONMENT == "production"

app = FastAPI(
    title=settings.PROJECT_NAME,
    # In production, API docs are hidden to prevent schema enumeration by attackers
    openapi_url=None if _is_prod else "/openapi.json",
    docs_url=None if _is_prod else "/docs",
    redoc_url=None if _is_prod else "/redoc",
    lifespan=lifespan,
)

# ----------------- Middlewares -----------------

# 1. HTTP Response Compression (Brotli primary, Gzip fallback, >= 512B threshold)
app.add_middleware(CompressionMiddleware, minimum_size=512, gzip_level=6, brotli_quality=4)

# 2. Sliding-Window Rate Limiting & DoS Protection
app.add_middleware(RateLimiterMiddleware)

# 2. Request ID, Timing & Security Headers
@app.middleware("http")
async def add_security_headers_and_timing(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    start_time = time.time()

    response = await call_next(request)

    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-Seconds"] = f"{process_time:.4f}"

    # Enterprise-Grade HTTP Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https: wss: ws: http:;"
    )
    return response

# 3. CORS
allowed_origins_list = (
    settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins_list,
    allow_origin_regex=r"^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$" if _is_prod else r"^https?:\/\/(localhost|127\.0\.0\.1|.*\.vercel\.app)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Request-ID"],
)


# ----------------- Exception Handlers -----------------
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# ----------------- Routes -----------------
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint — returns service info in production, redirects to docs in dev."""
    if _is_prod:
        return JSONResponse(content={
            "service": settings.PROJECT_NAME,
            "status": "running",
            "docs": "disabled in production",
            "health": "/health",
            "api": settings.API_V1_STR,
        })
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")


@app.api_route("/health", methods=["GET", "HEAD"], tags=["Health"])
async def root_health():
    """Primary health check endpoint used by uptime monitors."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
