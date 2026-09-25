import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_mock_interview_full_lifecycle(async_client: AsyncClient, auth_headers: dict):
    # 1. Setup profile with project and skills
    await async_client.patch("/api/v1/profile", json={
        "full_name": "Interview Candidate",
        "headline": "Junior Backend Engineer",
        "experience_level": "0-1 years",
    }, headers=auth_headers)

    await async_client.post("/api/v1/profile/skills", json={"name": "Python", "proficiency": "Advanced"}, headers=auth_headers)
    await async_client.post("/api/v1/profile/skills", json={"name": "FastAPI", "proficiency": "Intermediate"}, headers=auth_headers)
    await async_client.post("/api/v1/profile/projects", json={
        "name": "Cloud Microservices API",
        "description": "Engineered high performance async endpoints with Redis caching.",
        "technologies": ["Python", "FastAPI", "Redis"],
    }, headers=auth_headers)

    # 2. Generate a 3-question mock session
    gen_payload = {
        "role": "Backend Engineer",
        "experience_level": "0-1 years",
        "num_questions": 3,
    }
    gen_res = await async_client.post("/api/v1/interviews/generate", json=gen_payload, headers=auth_headers)
    assert gen_res.status_code == 201
    interview_data = gen_res.json()
    interview_id = interview_data["id"]
    assert interview_data["status"] == "IN_PROGRESS"
    assert len(interview_data["questions"]) == 3

    # 3. Submit answer for Question 1
    q1 = interview_data["questions"][0]
    ans1_payload = {
        "question_id": q1["question_id"],
        "candidate_answer": "Asynchronous I/O utilizes non-blocking system calls and an event loop scheduler to handle high concurrency.",
    }
    ans1_res = await async_client.post(f"/api/v1/interviews/{interview_id}/answers", json=ans1_payload, headers=auth_headers)
    assert ans1_res.status_code == 200
    ans1_data = ans1_res.json()
    assert ans1_data["evaluation"]["technical_score"] > 0
    assert ans1_data["current_question_index"] == 1
    assert ans1_data["is_completed"] is False

    # 4. Submit answer for Question 2
    q2 = interview_data["questions"][1]
    ans2_payload = {
        "question_id": q2["question_id"],
        "candidate_answer": "In Cloud Microservices API, we cached frequently queried items in Redis and used exponential backoff for transient failures.",
    }
    ans2_res = await async_client.post(f"/api/v1/interviews/{interview_id}/answers", json=ans2_payload, headers=auth_headers)
    assert ans2_res.status_code == 200

    # 5. Submit answer for Question 3 (Last Question)
    q3 = interview_data["questions"][2]
    ans3_payload = {
        "question_id": q3["question_id"],
        "candidate_answer": "Situation: We had a critical deadline. Task: Optimize DB queries. Action: Added composite indexes. Result: Query latency dropped by 70%.",
    }
    ans3_res = await async_client.post(f"/api/v1/interviews/{interview_id}/answers", json=ans3_payload, headers=auth_headers)
    assert ans3_res.status_code == 200
    ans3_data = ans3_res.json()
    assert ans3_data["is_completed"] is True

    # 6. Fetch finalized interview details
    get_res = await async_client.get(f"/api/v1/interviews/{interview_id}", headers=auth_headers)
    assert get_res.status_code == 200
    final_data = get_res.json()
    assert final_data["status"] == "COMPLETED"
    assert final_data["overall_score"] is not None
    assert 0 <= final_data["overall_score"] <= 100
    assert len(final_data["strengths"]) > 0
    assert final_data["summary_feedback"] is not None

    # 7. List user interviews
    list_res = await async_client.get("/api/v1/interviews", headers=auth_headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) >= 1
    assert items[0]["id"] == interview_id

    # 8. Delete interview record
    del_res = await async_client.delete(f"/api/v1/interviews/{interview_id}", headers=auth_headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
