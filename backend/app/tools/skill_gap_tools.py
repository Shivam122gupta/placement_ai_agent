from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from app.tools.base import BaseTool, ToolExecutionContext
from app.services.skill_gap_service import SkillGapService
from app.schemas.skill_gap import RoadmapGenerateRequest


class GenerateStudyRoadmapInputSchema(BaseModel):
    target_role: Optional[str] = Field(default="Software Engineer", description="Target role name")
    duration_type: str = Field(default="2_weeks", description="'1_week', '2_weeks', or '1_month'")
    gap_skills: Optional[List[str]] = Field(default=None, description="List of missing skills to learn")
    job_id: Optional[str] = Field(default=None, description="Optional target Job ID")


class GenerateStudyRoadmapTool(BaseTool):
    name = "generate_study_roadmap"
    description = "Generates a personalized, time-budgeted study roadmap (1-Week Sprint, 2-Week Project Plan, 1-Month Mastery) with practice milestones and official resources."
    input_schema = GenerateStudyRoadmapInputSchema
    requires_confirmation = False

    async def execute(self, params: Dict[str, Any], context: ToolExecutionContext) -> Any:
        req = RoadmapGenerateRequest(
            target_role=params.get("target_role"),
            duration_type=params.get("duration_type", "2_weeks"),
            custom_gap_skills=params.get("gap_skills"),
            job_id=params.get("job_id"),
        )
        return await SkillGapService.generate_roadmap(user_id=context.user_id, request=req)
