import logging
from fastapi import APIRouter, Depends, HTTPException, status
from beanie import PydanticObjectId

from app.models.user import UserDocument
from app.models.profile import ProfileDocument
from app.models.resume import ResumeDocument, ResumeVersionDocument
from app.api.deps import get_current_user
from app.services.profile_service import ProfileService
from app.services.memory_service import memory_service
from app.schemas.memory import (
    MemorySearchRequest,
    MemorySearchResponse,
    CandidateNoteCreate,
    CandidateNoteResponse,
    MemoryStatsResponse,
    MemorySyncResponse,
)

logger = logging.getLogger("app.api.memory")
router = APIRouter()


@router.post("/sync", response_model=MemorySyncResponse, summary="Synchronize candidate profile & resumes into vector memory")
async def sync_memory(
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Chunks, embeds, and indexes the authenticated candidate's active profile
    and parsed resume versions into Qdrant vector memory.
    """
    user_id_str = str(current_user.id)
    user_oid = current_user.id if isinstance(current_user.id, PydanticObjectId) else PydanticObjectId(user_id_str)

    # 1. Fetch Profile
    profile = await ProfileDocument.find_one(ProfileDocument.user_id == user_oid)
    if not profile:
        await ProfileService.get_by_user_id(user_oid)
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == user_oid)

    profile_dict = profile.model_dump() if profile else {
        "full_name": current_user.email.split("@")[0] if current_user.email else "Candidate",
        "skills": [],
        "projects": [],
        "experience": [],
    }

    # 2. Fetch All Resumes & Latest Versions
    resumes_to_index = []
    resumes = await ResumeDocument.find(
        ResumeDocument.user_id == user_oid,
    ).to_list()

    for r in resumes:
        if r.status == "FAILED":
            continue
        version = await ResumeVersionDocument.find_one(
            ResumeVersionDocument.resume_id == r.id,
        )
        if not version:
            version = await ResumeVersionDocument.find_one(
                ResumeVersionDocument.user_id == user_oid,
            )
        if version and version.parsed_data:
            parsed = version.parsed_data.model_dump() if hasattr(version.parsed_data, "model_dump") else version.parsed_data
            resumes_to_index.append({
                "id": str(r.id),
                "parsed_data": parsed,
                "raw_text": version.raw_text or "",
            })

    try:
        response = memory_service.sync_candidate_memory(
            user_id=user_id_str,
            profile_dict=profile_dict,
            resumes=resumes_to_index,
        )
        return response
    except Exception as e:
        logger.error("Failed to sync candidate memory for user %s: %s", user_id_str, e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Memory synchronization failed: {str(e)}",
        )


@router.post("/search", response_model=MemorySearchResponse, summary="Semantic vector search across candidate knowledge")
async def search_memory(
    request: MemorySearchRequest,
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Searches candidate's vector knowledge base with strict tenant isolation.
    """
    try:
        results = memory_service.search_candidate_memory(
            user_id=str(current_user.id),
            query=request.query,
            doc_types=request.doc_types,
            top_k=request.top_k,
            score_threshold=request.score_threshold,
        )
        return MemorySearchResponse(
            query=request.query,
            total_found=len(results),
            results=results,
        )
    except Exception as e:
        logger.error("Error executing vector memory search: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Semantic memory search failed: {str(e)}",
        )


@router.post("/notes", response_model=CandidateNoteResponse, status_code=status.HTTP_201_CREATED, summary="Add custom learning note into semantic memory")
async def add_note(
    note: CandidateNoteCreate,
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Vectorizes and stores a candidate note/topic takeaway into their private semantic memory.
    """
    try:
        return memory_service.add_candidate_note(user_id=str(current_user.id), note=note)
    except Exception as e:
        logger.error("Error indexing candidate note: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to index note: {str(e)}",
        )


@router.get("/stats", response_model=MemoryStatsResponse, summary="Get candidate vector memory statistics")
async def get_stats(
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Returns the total number of indexed vector chunks and breakdown by document category.
    """
    return memory_service.get_memory_stats(user_id=str(current_user.id))


@router.delete("/chunks/{chunk_id}", summary="Delete a specific memory chunk")
async def delete_chunk(
    chunk_id: str,
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Deletes a single indexed chunk for the authenticated candidate.
    """
    memory_service.delete_candidate_memory(user_id=str(current_user.id), chunk_id=chunk_id)
    return {"success": True, "message": f"Chunk {chunk_id} deleted successfully."}


@router.delete("/clear", summary="Purge all candidate vector memory")
async def clear_all_memory(
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Completely purges all vector embeddings and chunks for the authenticated candidate.
    """
    memory_service.delete_candidate_memory(user_id=str(current_user.id))
    return {"success": True, "message": "All semantic memory chunks have been cleared."}
