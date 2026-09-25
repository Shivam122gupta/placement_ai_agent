from typing import List, Optional
from pydantic import BaseModel, Field


class RoadmapMilestoneSchema(BaseModel):
    day_or_week: str
    title: str
    target_skills: List[str] = Field(default_factory=list)
    key_topics: List[str] = Field(default_factory=list)
    practice_project_idea: Optional[str] = None
    recommended_resources: List[str] = Field(default_factory=list)
    completed: bool = False


class RoadmapGenerateRequest(BaseModel):
    job_id: Optional[str] = None
    target_role: Optional[str] = "Software Engineer"
    duration_type: str = Field(default="2_weeks", description="'1_week', '2_weeks', or '1_month'")
    custom_gap_skills: Optional[List[str]] = None


class SkillGapRoadmapResponse(BaseModel):
    id: str
    user_id: str
    job_id: Optional[str] = None
    target_role: str
    duration_type: str
    gap_skills: List[str]
    milestones: List[RoadmapMilestoneSchema]
    readiness_impact: str
    created_at: str
    updated_at: str


class LLMRoadmapOutput(BaseModel):
    target_role: str = "Software Engineer"
    readiness_impact: str = Field(description="Summary of readiness boost upon completing this roadmap")
    milestones: List[RoadmapMilestoneSchema] = Field(default_factory=list)
