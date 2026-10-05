from datetime import datetime, timezone
from typing import List, Optional
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field


class YouTubeResource(BaseModel):
    title: str
    url: str
    channel_title: Optional[str] = None
    thumbnail_url: Optional[str] = None


class RoadmapMilestone(BaseModel):
    day_or_week: str  # e.g., "Day 1-2", "Day 3-4", "Week 1", "Week 2"
    title: str
    target_skills: List[str] = Field(default_factory=list)
    key_topics: List[str] = Field(default_factory=list)
    practice_project_idea: Optional[str] = None
    recommended_resources: List[str] = Field(default_factory=list)
    youtube_playlists: List[YouTubeResource] = Field(default_factory=list)
    completed: bool = False


class SkillGapRoadmapDocument(Document):
    user_id: PydanticObjectId
    job_id: Optional[PydanticObjectId] = None
    target_role: str
    duration_type: str = "2_weeks"  # "1_week" | "2_weeks" | "1_month"
    gap_skills: List[str] = Field(default_factory=list)
    milestones: List[RoadmapMilestone] = Field(default_factory=list)
    readiness_impact: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "skill_gap_roadmaps"
        indexes = [
            "user_id",
            [("user_id", 1), ("job_id", 1)],
        ]
