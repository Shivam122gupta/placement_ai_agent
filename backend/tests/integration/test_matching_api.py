import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_job_match_and_recommendations_flow(async_client: AsyncClient, auth_headers: dict):
    # 1. Update Candidate Profile metadata
    profile_update = {
        "full_name": "Python Developer",
        "experience_level": "1-3 years",
    }
    prof_res = await async_client.patch("/api/v1/profile", json=profile_update, headers=auth_headers)
    assert prof_res.status_code == 200

    # Add Skills
    await async_client.post("/api/v1/profile/skills", json={"name": "Python", "proficiency": "Advanced"}, headers=auth_headers)
    await async_client.post("/api/v1/profile/skills", json={"name": "FastAPI", "proficiency": "Intermediate"}, headers=auth_headers)
    await async_client.post("/api/v1/profile/skills", json={"name": "PostgreSQL", "proficiency": "Intermediate"}, headers=auth_headers)

    # Add Project
    await async_client.post("/api/v1/profile/projects", json={
        "name": "Placement Agent System",
        "description": "Engineered microservices using Docker and MongoDB with FastAPI",
        "technologies": ["Python", "FastAPI", "Docker", "MongoDB"],
    }, headers=auth_headers)

    # 2. Ingest jobs via search
    search_res = await async_client.post("/api/v1/jobs/search", json={"query": "Backend", "limit": 5}, headers=auth_headers)
    assert search_res.status_code == 200
    job_id = search_res.json()["data"][0]["id"]

    # 3. Match candidate against job
    match_res = await async_client.post(f"/api/v1/jobs/{job_id}/match", headers=auth_headers)
    assert match_res.status_code == 200
    data = match_res.json()["data"]
    assert data["job_id"] == job_id
    assert 0 <= data["overall_score"] <= 100
    assert len(data["matched_skills"]) > 0
    assert "summary_reasoning" in data

    # 4. Fetch cached match breakdown
    get_match = await async_client.get(f"/api/v1/jobs/{job_id}/match", headers=auth_headers)
    assert get_match.status_code == 200
    assert get_match.json()["data"]["id"] == data["id"]

    # 5. Fetch Top recommendations
    top_res = await async_client.get("/api/v1/recommendations/top-matches", headers=auth_headers)
    assert top_res.status_code == 200
    assert isinstance(top_res.json()["data"], list)
