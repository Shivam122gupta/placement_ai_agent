from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from app.core.sanitizer import sanitize_text


class GenerateInterviewRequest(BaseModel):
    role: Optional[str] = Field(default="Software Engineer", description="Target role (e.g., 'Backend Engineer', 'Full Stack Developer')")
    experience_level: Optional[str] = Field(default="0-1 years", description="Experience level: '0-1 years', '1-3 years', 'Fresher'")
    job_id: Optional[str] = Field(default=None, description="Optional job ID to tailor interview questions specifically to the JD")
    num_questions: int = Field(default=5, ge=3, le=8, description="Number of questions in mock session")

    @field_validator("role", "experience_level", mode="before")
    @classmethod
    def sanitize_role_fields(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        return sanitize_text(str(v))


class SubmitAnswerRequest(BaseModel):
    question_id: str = Field(..., description="ID of the question being answered")
    candidate_answer: str = Field(..., min_length=5, max_length=10000, description="Candidate's technical or behavioral answer")

    @field_validator("candidate_answer", mode="before")
    @classmethod
    def sanitize_answer(cls, v: str) -> str:
        if not v:
            return v
        return sanitize_text(str(v), allow_basic_formatting=True)



class AnswerEvaluationSchema(BaseModel):
    technical_score: float = Field(..., ge=0.0, le=10.0)
    depth_score: float = Field(..., ge=0.0, le=10.0)
    communication_score: float = Field(..., ge=0.0, le=10.0)
    key_strengths: List[str] = Field(default_factory=list)
    missing_concepts: List[str] = Field(default_factory=list)
    actionable_feedback: str
    ideal_sample_response: str


class InterviewQuestionSchema(BaseModel):
    question_id: str
    order_num: int
    category: str
    difficulty: str
    question: str
    context_or_scenario: Optional[str] = None
    expected_concepts: List[str] = Field(default_factory=list)
    candidate_answer: Optional[str] = None
    evaluation: Optional[AnswerEvaluationSchema] = None


class MockInterviewResponse(BaseModel):
    id: str
    user_id: str
    job_id: Optional[str] = None
    title: str
    target_role: str
    experience_level: str
    status: str
    current_question_index: int
    total_questions: int
    overall_score: Optional[float] = None
    technical_score_avg: Optional[float] = None
    communication_score_avg: Optional[float] = None
    strengths: List[str] = Field(default_factory=list)
    improvement_areas: List[str] = Field(default_factory=list)
    summary_feedback: Optional[str] = None
    questions: List[InterviewQuestionSchema] = Field(default_factory=list)
    created_at: str
    completed_at: Optional[str] = None


class MockInterviewSummaryItem(BaseModel):
    id: str
    title: str
    target_role: str
    status: str
    overall_score: Optional[float] = None
    total_questions: int
    created_at: str


class SubmitAnswerResponse(BaseModel):
    interview_id: str
    question_id: str
    evaluation: AnswerEvaluationSchema
    current_question_index: int
    total_questions: int
    is_completed: bool
