from typing import Dict, Any, Optional
from beanie import PydanticObjectId
from pydantic import BaseModel, Field
from app.tools.base import BaseTool, ToolExecutionContext
from app.services.job_service import JobService
from app.schemas.job import JobSearchQuery


class SearchJobsInputSchema(BaseModel):
    query: Optional[str] = Field(default="", description="Search query like 'Backend', 'Full Stack', 'Python'")
    location: Optional[str] = Field(default=None, description="Location like 'Bengaluru', 'Remote', 'Delhi'")
    employment_type: Optional[str] = Field(default=None, description="'Internship', 'Full-time'")
    limit: Optional[int] = Field(default=5, ge=1, le=20)


class SearchJobsTool(BaseTool):
    name = "search_jobs"
    description = "Searches for live, deduplicated tech jobs and internships based on role, location, and type."
    input_schema = SearchJobsInputSchema
    requires_confirmation = False

    async def execute(self, params: Dict[str, Any], context: ToolExecutionContext) -> Any:
        query_obj = JobSearchQuery(
            query=params.get("query"),
            location=params.get("location"),
            employment_type=params.get("employment_type"),
            limit=params.get("limit", 5),
        )
        return await JobService.search_and_ingest(query_obj)


class GetJobDetailsInputSchema(BaseModel):
    job_id: str = Field(..., description="Target Job ID string")


class GetJobDetailsTool(BaseTool):
    name = "get_job_details"
    description = "Retrieves full details of a specific job including raw description and extracted required skills."
    input_schema = GetJobDetailsInputSchema
    requires_confirmation = False

    async def execute(self, params: Dict[str, Any], context: ToolExecutionContext) -> Any:
        obj_id = PydanticObjectId(params["job_id"])
        return await JobService.get_by_id(obj_id)


class AnalyzeJDInputSchema(BaseModel):
    raw_text: str = Field(..., min_length=20, description="Raw job description or vacancy text to parse")
    title: Optional[str] = "Software Developer"
    company: Optional[str] = "Tech Corp"


class AnalyzeJDTool(BaseTool):
    name = "analyze_job_description"
    description = "Parses raw job description text to extract mandatory vs preferred technical skills and experience."
    input_schema = AnalyzeJDInputSchema
    requires_confirmation = False

    async def execute(self, params: Dict[str, Any], context: ToolExecutionContext) -> Any:
        return await JobService.analyze_custom_jd(
            raw_text=params["raw_text"],
            title=params.get("title"),
            company=params.get("company"),
        )
