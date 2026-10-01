from typing import Dict, Any
from beanie import PydanticObjectId
from pydantic import BaseModel, Field
from app.tools.base import BaseTool, ToolExecutionContext
from app.services.matching_service import MatchingService


class MatchCandidateInputSchema(BaseModel):
    job_id: str = Field(..., description="Target Job ID string to evaluate candidate fit against")


class MatchCandidateTool(BaseTool):
    name = "match_candidate"
    description = "Evaluates hybrid fit between candidate profile and target job. Returns match score (0-100%), verified matched skills with citations, and missing gaps."
    input_schema = MatchCandidateInputSchema
    requires_confirmation = False

    async def execute(self, params: Dict[str, Any], context: ToolExecutionContext) -> Any:
        obj_id = PydanticObjectId(params["job_id"])
        return await MatchingService.match_candidate_to_job(user_id=context.user_id, job_id=obj_id)


class EmptyInput(BaseModel):
    pass


class GetTopRecommendationsTool(BaseTool):
    name = "get_top_job_recommendations"
    description = "Fetches the top recommended jobs ranked by highest match score for the candidate."
    input_schema = EmptyInput
    requires_confirmation = False

    async def execute(self, params: Dict[str, Any], context: ToolExecutionContext) -> Any:
        return await MatchingService.get_top_recommended_jobs(user_id=context.user_id, limit=5)
