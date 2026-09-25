from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from app.tools.base import BaseTool, ToolExecutionContext
from app.services.application_service import application_service
from app.schemas.application import ApplicationCreate


class SaveApplicationInputSchema(BaseModel):
    job_id: str = Field(..., description="Target Job ID")
    status: Optional[str] = Field(default="APPLIED", description="Application status e.g. 'SAVED', 'APPLIED', 'ASSESSMENT', 'INTERVIEW'")
    notes: Optional[str] = Field(default="", description="Optional candidate notes or cover letter notes")


class SaveApplicationTool(BaseTool):
    name = "save_application"
    description = "Tracks or logs a job application for the candidate. CONSTITUTIONAL REQUIREMENT: Requires explicit candidate confirmation before saving."
    input_schema = SaveApplicationInputSchema
    requires_confirmation = True  # Human-in-the-Loop (HITL) confirmation required

    async def execute(self, params: Dict[str, Any], context: ToolExecutionContext) -> Any:
        job_id = params.get("job_id")
        status = params.get("status", "APPLIED")
        notes = params.get("notes", "")

        try:
            doc = await application_service.create_or_save_application(
                user_id=context.user_id,
                payload=ApplicationCreate(job_id=job_id, status=status, notes=notes),
            )
            return {
                "application_id": str(doc.id),
                "company_name": doc.company_name,
                "job_title": doc.job_title,
                "status": doc.status,
                "notes": doc.notes,
                "confirmed_by_user": True,
                "message": f"Successfully logged application for {doc.job_title} at {doc.company_name} to your pipeline.",
            }
        except ValueError as ve:
            return {
                "status": "DUPLICATE_NOTICE",
                "message": str(ve),
            }


class ListCandidateApplicationsInputSchema(BaseModel):
    status: Optional[str] = Field(default=None, description="Optional filter by status (e.g. 'INTERVIEW', 'APPLIED', 'OFFER')")


class ListCandidateApplicationsTool(BaseTool):
    name = "list_candidate_applications"
    description = "Lists all tracked job applications in the candidate's pipeline, including statuses, upcoming interview dates, and notes."
    input_schema = ListCandidateApplicationsInputSchema
    requires_confirmation = False

    async def execute(self, params: Dict[str, Any], context: ToolExecutionContext) -> Any:
        status_filter = params.get("status")
        docs = await application_service.list_applications(
            user_id=context.user_id,
            status=status_filter,
        )
        return [
            {
                "id": str(d.id),
                "company_name": d.company_name,
                "job_title": d.job_title,
                "status": d.status,
                "applied_date": d.applied_date.isoformat() if d.applied_date else None,
                "interview_date": d.interview_date.isoformat() if d.interview_date else None,
                "match_score": d.match_score,
                "notes": d.notes,
            }
            for d in docs
        ]
