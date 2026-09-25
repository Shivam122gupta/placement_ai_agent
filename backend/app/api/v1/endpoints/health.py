from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from app.db.session import get_db_client
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/ready", status_code=status.HTTP_200_OK)
async def readiness_check():
    client = get_db_client()
    db_status = "unavailable"
    
    if client:
        try:
            # Ping MongoDB
            await client.admin.command('ping')
            db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)}"
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={
                    "status": "not_ready",
                    "database": db_status,
                }
            )

    return {
        "status": "ready",
        "database": db_status,
    }
