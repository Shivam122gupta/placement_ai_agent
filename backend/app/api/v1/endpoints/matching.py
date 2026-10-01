import logging
from typing import List, Dict
from fastapi import APIRouter, Depends, Path
from beanie import PydanticObjectId

from app.schemas.matching import JobMatchResponse
from app.schemas.common import StandardResponse
from app.services.matching_service import MatchingService
from app.api.deps import get_current_user
from app.models.user import UserDocument
from app.core.exceptions import AppException

router = APIRouter()
logger = logging.getLogger("app.api.matching")


@router.post("/jobs/{job_id}/match", response_model=StandardResponse[JobMatchResponse])
async def execute_job_match(
    job_id: str = Path(..., description="Target Job ID to match candidate profile against"),
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Executes a hybrid match between candidate profile/resume and target job requirements.
    Calculates deterministic skill overlap, experience alignment, and grounded LLM reasoning.
    """
    try:
        obj_id = PydanticObjectId(job_id)
    except Exception:
        raise AppException(status_code=400, code="INVALID_ID", message="Invalid Job ID format")

    match_result = await MatchingService.match_candidate_to_job(user_id=current_user.id, job_id=obj_id)
    return StandardResponse(
        success=True,
        message="Job match evaluated successfully",
        data=match_result,
    )


@router.get("/jobs/{job_id}/match", response_model=StandardResponse[JobMatchResponse])
async def get_job_match(
    job_id: str = Path(..., description="Target Job ID"),
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Retrieves the existing or on-the-fly calculated match breakdown for a given job.
    """
    try:
        obj_id = PydanticObjectId(job_id)
    except Exception:
        raise AppException(status_code=400, code="INVALID_ID", message="Invalid Job ID format")

    match_result = await MatchingService.get_match_by_job(user_id=current_user.id, job_id=obj_id)
    return StandardResponse(
        success=True,
        message="Job match fetched successfully",
        data=match_result,
    )


@router.get("/recommendations/top-matches", response_model=StandardResponse[List[Dict]])
async def get_top_job_recommendations(
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Returns top matching jobs ranked by candidate alignment score.
    """
    recommendations = await MatchingService.get_top_recommended_jobs(user_id=current_user.id, limit=6)
    return StandardResponse(
        success=True,
        message="Top matching recommendations fetched",
        data=recommendations,
    )
