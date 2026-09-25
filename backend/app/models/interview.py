import uuid
from datetime import datetime, timezone
from typing import List, Optional
from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field


class AnswerEvaluationItem(BaseModel):
    technical_score: float = Field(..., ge=0.0, le=10.0, description="Technical correctness & accuracy (0-10)")
    depth_score: float = Field(..., ge=0.0, le=10.0, description="Depth, trade-offs, and completeness (0-10)")
    communication_score: float = Field(..., ge=0.0, le=10.0, description="Clarity, structure (STAR), and delivery (0-10)")
    key_strengths: List[str] = Field(default_factory=list)
    missing_concepts: List[str] = Field(default_factory=list)
    actionable_feedback: str
    ideal_sample_response: str


class InterviewQuestionItem(BaseModel):
    question_id: str = Field(default_factory=lambda: f"q_{uuid.uuid4().hex[:8]}")
    order_num: int
    category: str  # "TECHNICAL", "PROJECT_DEEP_DIVE", "SYSTEM_DESIGN", "BEHAVIORAL_STAR"
    difficulty: str  # "EASY", "MEDIUM", "HARD"
    question: str
    context_or_scenario: Optional[str] = None
    expected_concepts: List[str] = Field(default_factory=list)
    candidate_answer: Optional[str] = None
    evaluation: Optional[AnswerEvaluationItem] = None
    answered_at: Optional[datetime] = None


class MockInterviewDocument(Document):
    user_id: Indexed(PydanticObjectId)
    job_id: Optional[str] = None
    title: str
    target_role: str
    experience_level: str = "0-1 years"
    status: str = "IN_PROGRESS"  # "IN_PROGRESS", "COMPLETED", "ABANDONED"
    current_question_index: int = 0
    total_questions: int = 5
    overall_score: Optional[float] = None  # 0 to 100
    technical_score_avg: Optional[float] = None  # 0 to 10
    communication_score_avg: Optional[float] = None  # 0 to 10
    strengths: List[str] = Field(default_factory=list)
    improvement_areas: List[str] = Field(default_factory=list)
    summary_feedback: Optional[str] = None
    questions: List[InterviewQuestionItem] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

    class Settings:
        name = "mock_interviews"
        use_state_management = True
        indexes = [
            "user_id",
            "status",
            "created_at",
        ]
