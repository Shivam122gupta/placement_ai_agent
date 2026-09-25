from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class MemorySearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="Natural language semantic search query")
    doc_types: Optional[List[str]] = Field(
        default=None,
        description="Filter by document types (e.g. ['profile_project', 'resume', 'skills', 'candidate_note'])"
    )
    top_k: int = Field(default=5, ge=1, le=25, description="Maximum number of relevant chunks to retrieve")
    score_threshold: float = Field(default=0.0, ge=-1.0, le=1.0, description="Minimum cosine similarity threshold")


class MemorySearchResultItem(BaseModel):
    chunk_id: str
    title: str
    content: str
    section: str
    doc_type: str
    skills: List[str] = Field(default_factory=list)
    score: float
    source_id: Optional[str] = None
    created_at: Optional[str] = None


class MemorySearchResponse(BaseModel):
    query: str
    total_found: int
    results: List[MemorySearchResultItem]


class CandidateNoteCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Title of note or learning topic")
    content: str = Field(..., min_length=1, max_length=5000, description="Note body, system design snippet or learnings")
    tags: List[str] = Field(default_factory=list, description="Skill tags or keywords (e.g. ['Redis', 'Caching'])")


class CandidateNoteResponse(BaseModel):
    chunk_id: str
    title: str
    content: str
    tags: List[str]
    created_at: str


class MemoryStatsResponse(BaseModel):
    user_id: str
    total_chunks: int
    doc_type_breakdown: Dict[str, int]
    collection_name: str
    status: str


class MemorySyncResponse(BaseModel):
    success: bool
    message: str
    chunks_indexed: int
    profile_chunks: int
    resume_chunks: int
