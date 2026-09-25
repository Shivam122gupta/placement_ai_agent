import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_agent_chat_and_tool_execution_flow(async_client: AsyncClient, auth_headers: dict):
    # 1. Update Profile so agent has context
    await async_client.patch("/api/v1/profile", json={"full_name": "Agent User", "experience_level": "1-3 years"}, headers=auth_headers)
    await async_client.post("/api/v1/profile/skills", json={"name": "Python", "proficiency": "Advanced"}, headers=auth_headers)

    # 2. Chat with agent
    chat_payload = {
        "message": "Hello! What skills are on my profile?",
        "session_id": "test_session_123",
    }
    chat_res = await async_client.post("/api/v1/agent/chat", json=chat_payload, headers=auth_headers)
    assert chat_res.status_code == 200
    data = chat_res.json()["data"]
    assert data["session_id"] == "test_session_123"
    assert data["status"] in ["COMPLETED", "WAITING_CONFIRMATION"]
    assert len(data["response"]) > 0

    # 3. Test Human-in-the-loop action confirmation endpoint
    confirm_payload = {
        "session_id": "test_session_123",
        "tool_name": "save_application",
        "params": {"job_id": "6ab6db68856141fe753c2fab", "status": "APPLIED"},
        "decision": "approve",
    }
    confirm_res = await async_client.post("/api/v1/agent/confirm-action", json=confirm_payload, headers=auth_headers)
    assert confirm_res.status_code == 200
    confirm_data = confirm_res.json()["data"]
    assert "successfully approved" in confirm_data["response"].lower()

    # 4. Fetch Agent history traces
    history_res = await async_client.get("/api/v1/agent/history", headers=auth_headers)
    assert history_res.status_code == 200
    assert len(history_res.json()["data"]) >= 1
