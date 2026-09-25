from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class SkillMatchDetailSchema(BaseModel):
    skill: str
    is_required: bool
    matched: bool
    evidence_snippet: Optional[str] = None
    confidence: float = 1.0


class JobMatchResponse(BaseModel):
    id: str
    user_id: str
    job_id: str
    overall_score: int  # 0 - 100
    skills_score: int
    experience_score: int
    matched_skills: List[str]
    missing_skills: List[str]
    partial_skills: List[str]
    skill_details: List[SkillMatchDetailSchema]
    summary_reasoning: str
    strengths: List[str]
    key_gaps: List[str]
    created_at: str
    updated_at: str


class LLMMatchReasoningOutput(BaseModel):
    summary_reasoning: str = Field(default="Candidate evaluated against requirements.", description="Recruiter style honest assessment")
    strengths: List[str] = Field(default_factory=list, description="Top positive fit highlights with specific evidence")
    key_gaps: List[str] = Field(default_factory=list, description="Top blockers and missing competencies")
    recommended_focus_area: Optional[str] = None
