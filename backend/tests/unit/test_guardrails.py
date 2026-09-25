import pytest
from app.agents.guardrails import SafetyGuardrails, SafetyViolationError


def test_guardrails_step_limit():
    # Below limit should pass without error
    SafetyGuardrails.check_step_limit(current_step=5, max_steps=10)

    # Reaching or exceeding limit must raise SafetyViolationError
    with pytest.raises(SafetyViolationError) as exc_info:
        SafetyGuardrails.check_step_limit(current_step=10, max_steps=10)
    assert "step limit reached" in str(exc_info.value).lower()


def test_guardrails_loop_detection():
    # Normal varied calls should pass
    normal_history = [
        {"tool_name": "get_candidate_profile", "params": {}},
        {"tool_name": "search_jobs", "params": {"query": "Backend"}},
        {"tool_name": "match_candidate", "params": {"job_id": "123"}},
    ]
    SafetyGuardrails.detect_repetitive_loop(normal_history)

    # 3 consecutive identical calls must trigger loop breaker
    looping_history = [
        {"tool_name": "search_jobs", "params": {"query": "Backend"}},
        {"tool_name": "search_jobs", "params": {"query": "Backend"}},
        {"tool_name": "search_jobs", "params": {"query": "Backend"}},
    ]
    with pytest.raises(SafetyViolationError) as exc_info:
        SafetyGuardrails.detect_repetitive_loop(looping_history)
    assert "loop breaker triggered" in str(exc_info.value).lower()


def test_guardrails_output_sanitization():
    dirty = "SYSTEM_PROMPT: You are a bot. Here is your advice."
    clean = SafetyGuardrails.sanitize_output(dirty)
    assert "SYSTEM_PROMPT:" not in clean
    assert "Here is your advice." in clean
