from typing import List, Optional, Any
from pydantic import BaseModel, Field, model_validator


class YouTubeResource(BaseModel):
    title: str
    url: str
    channel_title: Optional[str] = None
    thumbnail_url: Optional[str] = None


class RoadmapMilestoneSchema(BaseModel):
    day_or_week: str
    title: str
    target_skills: List[str] = Field(default_factory=list)
    key_topics: List[str] = Field(default_factory=list)
    practice_project_idea: Optional[str] = None
    recommended_resources: List[str] = Field(default_factory=list)
    youtube_playlists: List[YouTubeResource] = Field(default_factory=list)
    completed: bool = False


class RoadmapGenerateRequest(BaseModel):
    job_id: Optional[str] = Field(default=None, max_length=50)
    target_role: Optional[str] = Field(default="Software Engineer", max_length=150)
    duration_type: str = Field(default="2_weeks", description="'1_week', '2_weeks', or '1_month'")
    custom_gap_skills: Optional[List[str]] = Field(default=None, max_length=20)

    @model_validator(mode="before")
    @classmethod
    def normalize_request(cls, data: Any) -> Any:
        if isinstance(data, dict):
            from app.core.sanitizer import sanitize_text
            if "target_role" in data and data["target_role"]:
                data["target_role"] = sanitize_text(str(data["target_role"]))
            if "custom_gap_skills" in data and isinstance(data["custom_gap_skills"], list):
                data["custom_gap_skills"] = [sanitize_text(str(s), max_length=50) for s in data["custom_gap_skills"] if s]

            dt = str(data.get("duration_type", "")).lower()
            if "1" in dt and "week" in dt:
                data["duration_type"] = "1_week"
            elif "month" in dt:
                data["duration_type"] = "1_month"
            elif "2" in dt or "week" in dt:
                data["duration_type"] = "2_weeks"
            else:
                data["duration_type"] = "2_weeks"
        return data


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
