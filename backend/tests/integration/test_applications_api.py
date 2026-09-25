import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_application_lifecycle_and_duplicate_prevention(async_client: AsyncClient, auth_headers: dict):
    # 1. Ingest a job first
    search_res = await async_client.post("/api/v1/jobs/search", json={"query": "Backend", "limit": 2}, headers=auth_headers)
    assert search_res.status_code == 200
    job_id = search_res.json()["data"][0]["id"]

    # 2. Track application for this job
    app_payload = {
        "job_id": job_id,
        "status": "APPLIED",
        "notes": "Submitted tailored resume and cover letter.",
    }
    create_res = await async_client.post("/api/v1/applications", json=app_payload, headers=auth_headers)
    assert create_res.status_code == 201
    app_data = create_res.json()
    app_id = app_data["id"]
    assert app_data["job_id"] == job_id
    assert app_data["status"] == "APPLIED"
    assert app_data["company_name"] != ""

    # 3. Attempt duplicate application -> must return 409 Conflict
    dup_res = await async_client.post("/api/v1/applications", json=app_payload, headers=auth_headers)
    assert dup_res.status_code == 409
    assert "already exists" in str(dup_res.json()).lower()


    # 4. List applications and verify filtering
    list_res = await async_client.get("/api/v1/applications?status=APPLIED", headers=auth_headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) >= 1
    assert items[0]["id"] == app_id

    # 5. Advance stage to INTERVIEW
    update_payload = {
        "status": "INTERVIEW",
        "interview_date": "2026-10-05T14:00:00Z",
        "next_action": "Prepare system design case study",
    }
    patch_res = await async_client.patch(f"/api/v1/applications/{app_id}", json=update_payload, headers=auth_headers)
    assert patch_res.status_code == 200
    updated_data = patch_res.json()
    assert updated_data["status"] == "INTERVIEW"
    assert updated_data["next_action"] == "Prepare system design case study"

    # 6. Verify pipeline stats
    stats_res = await async_client.get("/api/v1/applications/stats", headers=auth_headers)
    assert stats_res.status_code == 200
    stats_data = stats_res.json()
    assert stats_data["total_applications"] >= 1
    assert stats_data["interviews_count"] >= 1

    # 7. Delete application
    del_res = await async_client.delete(f"/api/v1/applications/{app_id}", headers=auth_headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
