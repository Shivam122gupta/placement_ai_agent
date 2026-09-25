from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.tools.base import BaseTool, ToolExecutionContext
from app.services.profile_service import ProfileService


class EmptyInputSchema(BaseModel):
    pass


class GetCandidateProfileTool(BaseTool):
    name = "get_candidate_profile"
    description = "Fetches the candidate's current profile, verified skills, career preferences, and projects."
    input_schema = EmptyInputSchema
    requires_confirmation = False

    async def execute(self, params: Dict[str, Any], context: ToolExecutionContext) -> Any:
        return await ProfileService.get_profile(user_id=context.user_id)
