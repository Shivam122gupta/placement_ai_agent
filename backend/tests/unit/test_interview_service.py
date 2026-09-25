import pytest
from app.services.interview_service import interview_service


def test_fallback_question_bank_grounding():
    skills = ["FastAPI", "Docker", "PostgreSQL"]
    projects = [
        {"name": "Distributed Pipeline", "technologies": ["FastAPI", "Docker"], "desc": "Event-driven architecture"}
    ]
    questions = interview_service._fallback_questions(
        role="Backend Engineer",
        verified_skills=skills,
        candidate_projects=projects,
        num_questions=5,
    )

    assert len(questions) == 5
    categories = [q["category"] for q in questions]
    assert "TECHNICAL" in categories
    assert "PROJECT_DEEP_DIVE" in categories
    assert "SYSTEM_DESIGN" in categories
    assert "BEHAVIORAL_STAR" in categories

    # Verify project deep-dive references the actual candidate project
    project_q = next(q for q in questions if q["category"] == "PROJECT_DEEP_DIVE")
    assert "Distributed Pipeline" in project_q["question"]


def test_rubric_evaluation_scoring():
    eval_res = interview_service._fallback_evaluation(
        question="How do async event loops operate in Python?",
        expected_concepts=["Event loop non-blocking I/O", "Coroutine execution", "CPU-bound vs I/O-bound"],
        candidate_answer=(
            "The event loop manages cooperative multitasking using coroutines and non-blocking I/O. "
            "When an async operation awaits, control is yielded back to the loop so other tasks run concurrently. "
            "For CPU-bound tasks, multiprocessing or background worker pools should be used to avoid blocking the event loop."
        ),
    )

    assert 0.0 <= eval_res["technical_score"] <= 10.0
    assert 0.0 <= eval_res["depth_score"] <= 10.0
    assert 0.0 <= eval_res["communication_score"] <= 10.0
    assert len(eval_res["key_strengths"]) > 0
    assert "ideal_sample_response" in eval_res
    assert "actionable_feedback" in eval_res
