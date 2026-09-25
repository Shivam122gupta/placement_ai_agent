import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_skill_gap_roadmap_crud_flow(async_client: AsyncClient, auth_headers: dict):
    # 1. Generate 1-Week Roadmap for custom gap skills
    generate_payload = {
        "target_role": "Backend Engineer",
        "duration_type": "1_week",
        "custom_gap_skills": ["Redis", "Kubernetes", "Kafka"],
    }
    gen_res = await async_client.post("/api/v1/skill-gaps/generate", json=generate_payload, headers=auth_headers)
    assert gen_res.status_code == 200
    roadmap = gen_res.json()["data"]
    roadmap_id = roadmap["id"]
    assert roadmap["target_role"] == "Backend Engineer"
    assert roadmap["duration_type"] == "1_week"
    assert len(roadmap["milestones"]) > 0
    assert "Redis" in roadmap["gap_skills"]

    # 2. List saved roadmaps
    list_res = await async_client.get("/api/v1/skill-gaps", headers=auth_headers)
    assert list_res.status_code == 200
    assert any(r["id"] == roadmap_id for r in list_res.json()["data"])

    # 3. Get roadmap by ID
    get_res = await async_client.get(f"/api/v1/skill-gaps/{roadmap_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["data"]["id"] == roadmap_id

    # 4. Toggle milestone completion
    toggle_res = await async_client.patch(f"/api/v1/skill-gaps/{roadmap_id}/milestones/0/toggle", headers=auth_headers)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["data"]["milestones"][0]["completed"] is True

    # 5. Delete roadmap
    del_res = await async_client.delete(f"/api/v1/skill-gaps/{roadmap_id}", headers=auth_headers)
    assert del_res.status_code == 204
