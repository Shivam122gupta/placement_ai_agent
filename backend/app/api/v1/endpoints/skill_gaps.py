import logging
from typing import List
from fastapi import APIRouter, Depends, Path, status
from beanie import PydanticObjectId

from app.schemas.skill_gap import RoadmapGenerateRequest, SkillGapRoadmapResponse
from app.schemas.common import StandardResponse
from app.services.skill_gap_service import SkillGapService
from app.api.deps import get_current_user
from app.models.user import UserDocument
from app.core.exceptions import AppException

router = APIRouter()
logger = logging.getLogger("app.api.skill_gaps")


@router.post("/generate", response_model=StandardResponse[SkillGapRoadmapResponse])
async def generate_skill_gap_roadmap(
    payload: RoadmapGenerateRequest,
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Generates a personalized 1-week, 2-week, or 1-month learning roadmap to bridge candidate skill gaps.
    """
    roadmap = await SkillGapService.generate_roadmap(user_id=current_user.id, request=payload)
    return StandardResponse(
        success=True,
        message="Learning roadmap generated successfully",
        data=roadmap,
    )


@router.get("", response_model=StandardResponse[List[SkillGapRoadmapResponse]])
async def list_saved_roadmaps(
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Lists all saved learning roadmaps for current candidate.
    """
    roadmaps = await SkillGapService.list_roadmaps(user_id=current_user.id)
    return StandardResponse(
        success=True,
        message="Roadmaps retrieved successfully",
        data=roadmaps,
    )


@router.get("/{roadmap_id}", response_model=StandardResponse[SkillGapRoadmapResponse])
async def get_roadmap(
    roadmap_id: str = Path(...),
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Fetches details of a specific study roadmap.
    """
    try:
        obj_id = PydanticObjectId(roadmap_id)
    except Exception:
        raise AppException(status_code=400, code="INVALID_ID", message="Invalid Roadmap ID format")

    roadmap = await SkillGapService.get_roadmap_by_id(user_id=current_user.id, roadmap_id=obj_id)
    return StandardResponse(
        success=True,
        message="Roadmap fetched successfully",
        data=roadmap,
    )


@router.patch("/{roadmap_id}/milestones/{milestone_index}/toggle", response_model=StandardResponse[SkillGapRoadmapResponse])
async def toggle_milestone_completion(
    roadmap_id: str = Path(...),
    milestone_index: int = Path(...),
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Toggles completion checkbox on a specific roadmap milestone.
    """
    try:
        obj_id = PydanticObjectId(roadmap_id)
    except Exception:
        raise AppException(status_code=400, code="INVALID_ID", message="Invalid Roadmap ID format")

    updated = await SkillGapService.toggle_milestone_status(
        user_id=current_user.id,
        roadmap_id=obj_id,
        milestone_index=milestone_index,
    )
    return StandardResponse(
        success=True,
        message="Milestone status updated",
        data=updated,
    )


@router.delete("/{roadmap_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_roadmap(
    roadmap_id: str = Path(...),
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Deletes a saved roadmap.
    """
    try:
        obj_id = PydanticObjectId(roadmap_id)
    except Exception:
        raise AppException(status_code=400, code="INVALID_ID", message="Invalid Roadmap ID format")

    await SkillGapService.delete_roadmap(user_id=current_user.id, roadmap_id=obj_id)
