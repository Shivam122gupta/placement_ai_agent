from fastapi import APIRouter, Depends, status
from app.schemas.profile import (
    ProfileUpdateRequest,
    EducationCreateRequest,
    ExperienceCreateRequest,
    SkillCreateRequest,
    ProjectCreateRequest,
    CertificationCreateRequest,
    ProfileResponse,
)
from app.schemas.common import StandardResponse
from app.services.profile_service import ProfileService
from app.services.resume_service import ResumeService
from app.models.resume import ResumeDocument, ResumeVersionDocument
from app.api.deps import get_current_active_user
from app.models.user import UserDocument
from app.core.exceptions import AppException

router = APIRouter(prefix="/profile", tags=["Candidate Profile"])


@router.get("", response_model=StandardResponse[ProfileResponse], status_code=status.HTTP_200_OK)
async def get_profile(current_user: UserDocument = Depends(get_current_active_user)):
    profile = await ProfileService.get_by_user_id(current_user.id)
    return StandardResponse(
        success=True,
        message="Candidate profile fetched successfully",
        data=profile,
    )


@router.patch("", response_model=StandardResponse[ProfileResponse], status_code=status.HTTP_200_OK)
async def update_profile(req: ProfileUpdateRequest, current_user: UserDocument = Depends(get_current_active_user)):
    profile = await ProfileService.update_profile(current_user.id, req)
    return StandardResponse(
        success=True,
        message="Candidate profile updated successfully",
        data=profile,
    )


@router.post("/auto-sync-latest-resume", response_model=StandardResponse[ProfileResponse], status_code=status.HTTP_200_OK)
async def auto_sync_latest_resume(current_user: UserDocument = Depends(get_current_active_user)):
    """
    Auto-populates candidate profile from their latest uploaded resume in 1-click.
    """
    latest_resume = await ResumeDocument.find_one(
        ResumeDocument.user_id == current_user.id,
        ResumeDocument.status == "COMPLETED",
        sort=[("created_at", -1)],
    )
    if not latest_resume:
        raise AppException(
            status_code=404,
            code="NO_RESUME_FOUND",
            message="No completed resume found to auto-populate profile from. Please upload a resume first.",
        )

    latest_version = await ResumeVersionDocument.find_one(
        ResumeVersionDocument.resume_id == latest_resume.id,
        sort=[("version_number", -1)],
    )
    if not latest_version or not latest_version.parsed_data:
        raise AppException(
            status_code=400,
            code="NO_PARSED_DATA",
            message="Latest resume has no parsed information available.",
        )

    profile = await ProfileService.sync_full_from_parsed_resume(current_user.id, latest_version.parsed_data)
    return StandardResponse(
        success=True,
        message="Candidate profile auto-populated successfully from resume!",
        data=profile,
    )


# ------------------- Education Sub-resource -------------------

@router.post("/education", response_model=StandardResponse[ProfileResponse], status_code=status.HTTP_201_CREATED)
async def add_education(req: EducationCreateRequest, current_user: UserDocument = Depends(get_current_active_user)):
    profile = await ProfileService.add_education(current_user.id, req)
    return StandardResponse(
        success=True,
        message="Education record added successfully",
        data=profile,
    )


@router.delete("/education/{item_id}", response_model=StandardResponse[ProfileResponse], status_code=status.HTTP_200_OK)
async def delete_education(item_id: str, current_user: UserDocument = Depends(get_current_active_user)):
    profile = await ProfileService.delete_education(current_user.id, item_id)
    return StandardResponse(
        success=True,
        message="Education record removed successfully",
        data=profile,
    )


# ------------------- Experience Sub-resource -------------------

@router.post("/experience", response_model=StandardResponse[ProfileResponse], status_code=status.HTTP_201_CREATED)
async def add_experience(req: ExperienceCreateRequest, current_user: UserDocument = Depends(get_current_active_user)):
    profile = await ProfileService.add_experience(current_user.id, req)
    return StandardResponse(
        success=True,
        message="Experience record added successfully",
        data=profile,
    )


@router.delete("/experience/{item_id}", response_model=StandardResponse[ProfileResponse], status_code=status.HTTP_200_OK)
async def delete_experience(item_id: str, current_user: UserDocument = Depends(get_current_active_user)):
    profile = await ProfileService.delete_experience(current_user.id, item_id)
    return StandardResponse(
        success=True,
        message="Experience record removed successfully",
        data=profile,
    )


# ------------------- Skills Sub-resource -------------------

@router.post("/skills", response_model=StandardResponse[ProfileResponse], status_code=status.HTTP_201_CREATED)
async def add_skill(req: SkillCreateRequest, current_user: UserDocument = Depends(get_current_active_user)):
    profile = await ProfileService.add_skill(current_user.id, req)
    return StandardResponse(
        success=True,
        message="Skill added successfully",
        data=profile,
    )


@router.delete("/skills/{item_id}", response_model=StandardResponse[ProfileResponse], status_code=status.HTTP_200_OK)
async def delete_skill(item_id: str, current_user: UserDocument = Depends(get_current_active_user)):
    profile = await ProfileService.delete_skill(current_user.id, item_id)
    return StandardResponse(
        success=True,
        message="Skill removed successfully",
        data=profile,
    )


# ------------------- Projects Sub-resource -------------------

@router.post("/projects", response_model=StandardResponse[ProfileResponse], status_code=status.HTTP_201_CREATED)
async def add_project(req: ProjectCreateRequest, current_user: UserDocument = Depends(get_current_active_user)):
    profile = await ProfileService.add_project(current_user.id, req)
    return StandardResponse(
        success=True,
        message="Project added successfully",
        data=profile,
    )


@router.delete("/projects/{item_id}", response_model=StandardResponse[ProfileResponse], status_code=status.HTTP_200_OK)
async def delete_project(item_id: str, current_user: UserDocument = Depends(get_current_active_user)):
    profile = await ProfileService.delete_project(current_user.id, item_id)
    return StandardResponse(
        success=True,
        message="Project removed successfully",
        data=profile,
    )


# ------------------- Certifications Sub-resource -------------------

@router.post("/certifications", response_model=StandardResponse[ProfileResponse], status_code=status.HTTP_201_CREATED)
async def add_certification(req: CertificationCreateRequest, current_user: UserDocument = Depends(get_current_active_user)):
    profile = await ProfileService.add_certification(current_user.id, req)
    return StandardResponse(
        success=True,
        message="Certification added successfully",
        data=profile,
    )


@router.delete("/certifications/{item_id}", response_model=StandardResponse[ProfileResponse], status_code=status.HTTP_200_OK)
async def delete_certification(item_id: str, current_user: UserDocument = Depends(get_current_active_user)):
    profile = await ProfileService.delete_certification(current_user.id, item_id)
    return StandardResponse(
        success=True,
        message="Certification removed successfully",
        data=profile,
    )
