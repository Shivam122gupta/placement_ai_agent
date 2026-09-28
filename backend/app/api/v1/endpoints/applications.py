import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.models.user import UserDocument
from app.api.deps import get_current_user
from app.services.application_service import application_service
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    PipelineStatsResponse,
)

logger = logging.getLogger("app.api.applications")
router = APIRouter()


def _to_application_response(doc) -> ApplicationResponse:
    return ApplicationResponse(
        id=str(doc.id),
        user_id=str(doc.user_id),
        job_id=str(doc.job_id) if doc.job_id else None,
        company_name=doc.company_name,
        job_title=doc.job_title,
        status=doc.status,
        applied_date=doc.applied_date.isoformat() if doc.applied_date else None,
        interview_date=doc.interview_date.isoformat() if doc.interview_date else None,
        next_action=doc.next_action,
        next_action_date=doc.next_action_date.isoformat() if doc.next_action_date else None,
        notes=doc.notes,
        salary_offered=doc.salary_offered,
        location=doc.location,
        match_score=doc.match_score,
        created_at=doc.created_at.isoformat() if doc.created_at else "",
        updated_at=doc.updated_at.isoformat() if doc.updated_at else "",
    )


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED, summary="Create or track a job application")
async def create_application(
    payload: ApplicationCreate,
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Saves a job opportunity into the candidate's application pipeline.
    Prevents duplicate entries with HTTP 409 Conflict.
    """
    try:
        doc = await application_service.create_or_save_application(
            user_id=str(current_user.id),
            payload=payload,
        )
        return _to_application_response(doc)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(ve))
    except Exception as e:
        logger.error("Failed to create application: %s", e, exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An internal error occurred. Please try again.")


@router.get("", response_model=List[ApplicationResponse], summary="List tracked job applications")
async def list_applications(
    status: Optional[str] = Query(None, description="Filter by status (e.g. SAVED, APPLIED, INTERVIEW, OFFER)"),
    search: Optional[str] = Query(None, description="Search company name, title, or notes"),
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Retrieves the candidate's tracked applications with optional status and text filters.
    """
    docs = await application_service.list_applications(
        user_id=str(current_user.id),
        status=status,
        search=search,
    )
    return [_to_application_response(d) for d in docs]


@router.get("/stats", response_model=PipelineStatsResponse, summary="Get application pipeline analytics")
async def get_stats(
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Returns pipeline stage distributions and interview-to-offer conversion metrics.
    """
    return await application_service.get_pipeline_stats(user_id=str(current_user.id))


@router.get("/{application_id}", response_model=ApplicationResponse, summary="Get single application details")
async def get_application(
    application_id: str,
    current_user: UserDocument = Depends(get_current_user),
):
    doc = await application_service.get_application_by_id(
        user_id=str(current_user.id),
        app_id=application_id,
    )
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application record not found.")
    return _to_application_response(doc)


@router.patch("/{application_id}", response_model=ApplicationResponse, summary="Update application stage or details")
async def update_application(
    application_id: str,
    payload: ApplicationUpdate,
    current_user: UserDocument = Depends(get_current_user),
):
    try:
        doc = await application_service.update_application(
            user_id=str(current_user.id),
            app_id=application_id,
            payload=payload,
        )
        return _to_application_response(doc)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        logger.error("Failed to update application: %s", e, exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An internal error occurred. Please try again.")


@router.delete("/{application_id}", summary="Delete an application record")
async def delete_application(
    application_id: str,
    current_user: UserDocument = Depends(get_current_user),
):
    success = await application_service.delete_application(
        user_id=str(current_user.id),
        app_id=application_id,
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application record not found.")
    return {"success": True, "message": "Application removed from pipeline."}
