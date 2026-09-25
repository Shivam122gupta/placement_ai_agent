import io
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, status, Response
from fastapi.responses import StreamingResponse
from beanie import PydanticObjectId

from app.schemas.resume import ResumeResponse, ProfileSyncRequest
from app.schemas.profile import ProfileResponse
from app.schemas.common import StandardResponse, MessageResponse
from app.services.resume_service import ResumeService
from app.api.deps import get_current_active_user
from app.models.user import UserDocument

router = APIRouter(prefix="/resumes", tags=["Resume Intelligence"])


@router.post("", response_model=StandardResponse[ResumeResponse], status_code=status.HTTP_201_CREATED)
async def upload_and_parse_resume(
    file: UploadFile = File(...),
    current_user: UserDocument = Depends(get_current_active_user),
):
    result = await ResumeService.upload_and_parse(user_id=current_user.id, file=file)
    return StandardResponse(
        success=True,
        message="Resume uploaded and parsed successfully",
        data=result,
    )


@router.get("", response_model=StandardResponse[List[ResumeResponse]], status_code=status.HTTP_200_OK)
async def list_resumes(current_user: UserDocument = Depends(get_current_active_user)):
    resumes = await ResumeService.get_user_resumes(user_id=current_user.id)
    return StandardResponse(
        success=True,
        message="Resumes fetched successfully",
        data=resumes,
    )


@router.get("/{resume_id}", response_model=StandardResponse[ResumeResponse], status_code=status.HTTP_200_OK)
async def get_resume(resume_id: str, current_user: UserDocument = Depends(get_current_active_user)):
    resume = await ResumeService.get_resume_by_id(
        user_id=current_user.id,
        resume_id=PydanticObjectId(resume_id),
    )
    return StandardResponse(
        success=True,
        message="Resume fetched successfully",
        data=resume,
    )


@router.get("/{resume_id}/download")
async def download_resume(resume_id: str, current_user: UserDocument = Depends(get_current_active_user)):
    file_bytes, filename, mime_type = await ResumeService.get_raw_file_for_download(
        user_id=current_user.id,
        resume_id=PydanticObjectId(resume_id),
    )
    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=mime_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{resume_id}/sync-profile", response_model=StandardResponse[ProfileResponse], status_code=status.HTTP_200_OK)
async def sync_resume_to_profile(
    resume_id: str,
    sync_req: ProfileSyncRequest,
    current_user: UserDocument = Depends(get_current_active_user),
):
    updated_profile = await ResumeService.sync_to_profile(
        user_id=current_user.id,
        resume_id=PydanticObjectId(resume_id),
        sync_req=sync_req,
    )
    return StandardResponse(
        success=True,
        message="Resume details synchronized with candidate profile",
        data=updated_profile,
    )


@router.delete("/{resume_id}", response_model=StandardResponse[MessageResponse], status_code=status.HTTP_200_OK)
async def delete_resume(resume_id: str, current_user: UserDocument = Depends(get_current_active_user)):
    await ResumeService.delete_resume(
        user_id=current_user.id,
        resume_id=PydanticObjectId(resume_id),
    )
    return StandardResponse(
        success=True,
        message="Resume deleted successfully",
        data=MessageResponse(message="Resume deleted successfully"),
    )
