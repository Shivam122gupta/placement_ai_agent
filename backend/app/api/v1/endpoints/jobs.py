from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from beanie import PydanticObjectId

from app.schemas.job import (
    JobResponse,
    JobSearchQuery,
    JDAnalysisRequest,
    JDAnalysisResponse,
)
from app.schemas.common import StandardResponse
from app.services.job_service import JobService
from app.api.deps import get_current_active_user
from app.models.user import UserDocument
from app.core.exceptions import AppException

router = APIRouter(prefix="/jobs", tags=["Job Intelligence"])


@router.post("/search", response_model=StandardResponse[List[JobResponse]], status_code=status.HTTP_200_OK)
async def search_jobs(
    query: JobSearchQuery,
    current_user: UserDocument = Depends(get_current_active_user),
):
    jobs = await JobService.search_and_ingest(query)
    return StandardResponse(
        success=True,
        message=f"Found {len(jobs)} relevant jobs",
        data=jobs,
    )


@router.get("", response_model=StandardResponse[List[JobResponse]], status_code=status.HTTP_200_OK)
async def list_jobs(
    query: Optional[str] = Query(None, description="Search by title or company"),
    location: Optional[str] = Query(None, description="Filter by location"),
    employment_type: Optional[str] = Query(None, description="Filter by Internship or Full-time"),
    limit: int = Query(20, ge=1, le=50, description="Max 50 items per request to mitigate mass scraping"),
    skip: int = Query(0, ge=0, le=1000, description="Max pagination offset 1000"),
    current_user: UserDocument = Depends(get_current_active_user),
):
    if skip > 1000:
        raise AppException(
            status_code=400,
            code="SCRAPING_PREVENTION_OFFSET_EXCEEDED",
            message="Maximum pagination offset is 1000. Please use search keywords or filters to narrow results.",
        )
    jobs = await JobService.list_jobs(
        query=query,
        location=location,
        employment_type=employment_type,
        limit=limit,
        skip=skip,
    )
    return StandardResponse(
        success=True,
        message="Jobs fetched successfully",
        data=jobs,
    )


@router.get("/{job_id}", response_model=StandardResponse[JobResponse], status_code=status.HTTP_200_OK)
async def get_job(job_id: str, current_user: UserDocument = Depends(get_current_active_user)):
    try:
        obj_id = PydanticObjectId(job_id)
    except Exception:
        raise AppException(status_code=400, code="INVALID_ID", message="Invalid Job ID format")
    job = await JobService.get_by_id(obj_id)
    return StandardResponse(
        success=True,
        message="Job details fetched successfully",
        data=job,
    )


@router.post("/analyze-jd", response_model=StandardResponse[JDAnalysisResponse], status_code=status.HTTP_200_OK)
async def analyze_job_description(
    req: JDAnalysisRequest,
    current_user: UserDocument = Depends(get_current_active_user),
):
    result = await JobService.analyze_custom_jd(
        raw_text=req.raw_text,
        title=req.title,
        company=req.company,
    )
    return StandardResponse(
        success=True,
        message="Job description analyzed successfully",
        data=result,
    )
