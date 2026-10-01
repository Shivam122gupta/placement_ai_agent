import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.models.user import UserDocument
from app.api.deps import get_current_user
from app.services.interview_service import interview_service
from app.schemas.interview import (
    GenerateInterviewRequest,
    SubmitAnswerRequest,
    MockInterviewResponse,
    MockInterviewSummaryItem,
    SubmitAnswerResponse,
    InterviewQuestionSchema,
    AnswerEvaluationSchema,
)

logger = logging.getLogger("app.api.interviews")
router = APIRouter()


def _to_interview_response(doc) -> MockInterviewResponse:
    return MockInterviewResponse(
        id=str(doc.id),
        user_id=str(doc.user_id),
        job_id=doc.job_id,
        title=doc.title,
        target_role=doc.target_role,
        experience_level=doc.experience_level,
        status=doc.status,
        current_question_index=doc.current_question_index,
        total_questions=doc.total_questions,
        overall_score=doc.overall_score,
        technical_score_avg=doc.technical_score_avg,
        communication_score_avg=doc.communication_score_avg,
        strengths=doc.strengths,
        improvement_areas=doc.improvement_areas,
        summary_feedback=doc.summary_feedback,
        questions=[
            InterviewQuestionSchema(
                question_id=q.question_id,
                order_num=q.order_num,
                category=q.category,
                difficulty=q.difficulty,
                question=q.question,
                context_or_scenario=q.context_or_scenario,
                expected_concepts=q.expected_concepts,
                candidate_answer=q.candidate_answer,
                evaluation=AnswerEvaluationSchema(**q.evaluation.model_dump()) if q.evaluation else None,
            )
            for q in doc.questions
        ],
        created_at=doc.created_at.isoformat() if doc.created_at else "",
        completed_at=doc.completed_at.isoformat() if doc.completed_at else None,
    )


@router.post("/generate", response_model=MockInterviewResponse, status_code=status.HTTP_201_CREATED, summary="Generate customized mock interview session")
async def generate_interview(
    request: GenerateInterviewRequest,
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Generates a tailored 5-question mock interview session strictly grounded
    in candidate verified skills, actual projects, and target job opening.
    """
    try:
        interview_doc = await interview_service.generate_mock_interview(
            user_id=str(current_user.id),
            request=request,
        )
        return _to_interview_response(interview_doc)
    except Exception as e:
        logger.error("Failed to generate mock interview: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Interview generation failed: {str(e)}",
        )


@router.get("", response_model=List[MockInterviewSummaryItem], summary="List past mock interview sessions")
async def list_interviews(
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Returns candidate's past mock interview sessions with score summaries.
    """
    docs = await interview_service.get_user_interviews(user_id=str(current_user.id))
    return [
        MockInterviewSummaryItem(
            id=str(d.id),
            title=d.title,
            target_role=d.target_role,
            status=d.status,
            overall_score=d.overall_score,
            total_questions=d.total_questions,
            created_at=d.created_at.isoformat() if d.created_at else "",
        )
        for d in docs
    ]


@router.get("/{interview_id}", response_model=MockInterviewResponse, summary="Get mock interview details")
async def get_interview(
    interview_id: str,
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Retrieves full details and question progress for a specific interview session.
    """
    doc = await interview_service.get_interview_by_id(
        user_id=str(current_user.id),
        interview_id=interview_id,
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock interview session not found.",
        )
    return _to_interview_response(doc)


@router.post("/{interview_id}/answers", response_model=SubmitAnswerResponse, summary="Submit candidate answer for evaluation")
async def submit_answer(
    interview_id: str,
    request: SubmitAnswerRequest,
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Submits candidate answer for a question and returns real-time 3-pillar rubric evaluation.
    """
    try:
        return await interview_service.evaluate_answer(
            user_id=str(current_user.id),
            interview_id=interview_id,
            request=request,
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error("Failed to evaluate answer: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Answer evaluation failed: {str(e)}",
        )


@router.post("/{interview_id}/complete", response_model=MockInterviewResponse, summary="Finalize mock interview session")
async def complete_interview(
    interview_id: str,
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Manually wraps up the session and calculates final composite score.
    """
    doc = await interview_service.get_interview_by_id(
        user_id=str(current_user.id),
        interview_id=interview_id,
    )
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")

    await interview_service._finalize_interview(doc)
    return _to_interview_response(doc)


@router.delete("/{interview_id}", summary="Delete mock interview record")
async def delete_interview(
    interview_id: str,
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Deletes a mock interview session record.
    """
    success = await interview_service.delete_interview(
        user_id=str(current_user.id),
        interview_id=interview_id,
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")
    return {"success": True, "message": "Interview session deleted successfully."}
