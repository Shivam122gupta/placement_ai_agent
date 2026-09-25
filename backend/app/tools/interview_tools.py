from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from app.tools.base import BaseTool, ToolExecutionContext
from app.services.interview_service import interview_service
from app.schemas.interview import GenerateInterviewRequest


class StartMockInterviewInputSchema(BaseModel):
    role: Optional[str] = Field(default="Software Engineer", description="Target role (e.g. 'Backend Engineer', 'Full Stack Developer')")
    job_id: Optional[str] = Field(default=None, description="Optional Job ID to tailor the questions to specific job requirements")
    num_questions: int = Field(default=5, ge=3, le=8, description="Number of questions in mock session")


class StartMockInterviewTool(BaseTool):
    name = "start_mock_interview"
    description = "Initiates an interactive mock interview session tailored to the candidate's verified skills and job requirements."
    input_schema = StartMockInterviewInputSchema
    requires_confirmation = False

    async def execute(self, params: Dict[str, Any], context: ToolExecutionContext) -> Any:
        role = params.get("role", "Software Engineer")
        job_id = params.get("job_id")
        num_questions = params.get("num_questions", 5)

        req = GenerateInterviewRequest(role=role, job_id=job_id, num_questions=num_questions)
        interview_doc = await interview_service.generate_mock_interview(
            user_id=context.user_id,
            request=req,
        )

        return {
            "interview_id": str(interview_doc.id),
            "title": interview_doc.title,
            "target_role": interview_doc.target_role,
            "total_questions": interview_doc.total_questions,
            "first_question": {
                "question_id": interview_doc.questions[0].question_id,
                "category": interview_doc.questions[0].category,
                "difficulty": interview_doc.questions[0].difficulty,
                "question": interview_doc.questions[0].question,
            },
            "status": interview_doc.status,
        }


class GetMockInterviewHistoryInputSchema(BaseModel):
    pass


class GetMockInterviewHistoryTool(BaseTool):
    name = "get_mock_interview_history"
    description = "Retrieves the candidate's past mock interview performance scores, strengths, and areas for improvement."
    input_schema = GetMockInterviewHistoryInputSchema
    requires_confirmation = False

    async def execute(self, params: Dict[str, Any], context: ToolExecutionContext) -> Any:
        docs = await interview_service.get_user_interviews(user_id=context.user_id)
        return [
            {
                "interview_id": str(d.id),
                "title": d.title,
                "status": d.status,
                "overall_score": d.overall_score,
                "technical_score_avg": d.technical_score_avg,
                "communication_score_avg": d.communication_score_avg,
                "strengths": d.strengths,
                "improvement_areas": d.improvement_areas,
                "created_at": d.created_at.isoformat() if d.created_at else "",
            }
            for d in docs[:5]
        ]
