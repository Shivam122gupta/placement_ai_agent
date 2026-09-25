import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_job_search_and_ingestion(async_client: AsyncClient, auth_headers: dict):
    # 1. Search & Ingest jobs via Mock Provider
    search_payload = {
        "query": "Backend",
        "location": "Bengaluru",
        "employment_type": "Internship",
        "limit": 5,
    }
    search_res = await async_client.post("/api/v1/jobs/search", json=search_payload, headers=auth_headers)
    assert search_res.status_code == 200
    search_json = search_res.json()
    assert search_json["success"] is True
    assert len(search_json["data"]) >= 1
    job_id = search_json["data"][0]["id"]
    assert "required_skills" in search_json["data"][0]["requirements"]

    # 2. List jobs with query filter
    list_res = await async_client.get("/api/v1/jobs?query=Backend", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) >= 1

    # 3. Get single job details
    get_res = await async_client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["data"]["id"] == job_id
    assert get_res.json()["data"]["company"] == "Nexus AI Labs"


@pytest.mark.asyncio
async def test_custom_jd_analyzer(async_client: AsyncClient, auth_headers: dict):
    raw_jd = (
        "We are looking for a Python Backend Intern to join our engineering team. "
        "Required: Python, FastAPI, PostgreSQL, and REST APIs. "
        "Preferred: Docker, Redis, and AWS. "
        "Responsibilities: Design microservices and optimize SQL queries."
    )
    analyze_payload = {
        "raw_text": raw_jd,
        "title": "Backend Intern",
        "company": "StartupX",
    }
    analyze_res = await async_client.post("/api/v1/jobs/analyze-jd", json=analyze_payload, headers=auth_headers)
    assert analyze_res.status_code == 200
    data = analyze_res.json()["data"]
    assert data["title"] == "Backend Intern"
    assert "required_skills" in data["requirements"]
    assert len(data["requirements"]["required_skills"]) > 0
