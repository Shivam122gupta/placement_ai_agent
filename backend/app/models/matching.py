from datetime import datetime, timezone
from typing import List, Optional
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field


class SkillMatchDetail(BaseModel):
    skill: str
    is_required: bool = True
    matched: bool = False
    evidence_snippet: Optional[str] = None
    confidence: float = 1.0


class JobMatchDocument(Document):
    user_id: PydanticObjectId
    job_id: PydanticObjectId
    overall_score: int = Field(default=0, ge=0, le=100)  # 0 to 100
    skills_score: int = Field(default=0, ge=0, le=100)
    experience_score: int = Field(default=0, ge=0, le=100)
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    partial_skills: List[str] = Field(default_factory=list)
    skill_details: List[SkillMatchDetail] = Field(default_factory=list)
    summary_reasoning: str = ""
    strengths: List[str] = Field(default_factory=list)
    key_gaps: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "job_matches"
        indexes = [
            [("user_id", 1), ("job_id", 1)],
            "user_id",
            "job_id",
        ]
