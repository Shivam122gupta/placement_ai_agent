import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_profile_crud_and_sub_resources(async_client: AsyncClient, auth_headers: dict):
    # 1. Fetch profile
    get_res = await async_client.get("/api/v1/profile", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["data"]["full_name"] == "Test Candidate"

    # 2. Update basic profile info
    update_payload = {
        "full_name": "Ankit Developer",
        "location": "Bengaluru, India",
        "target_roles": ["Backend Developer", "AI Engineer"],
        "preferred_locations": ["Bengaluru", "Remote"],
    }
    patch_res = await async_client.patch("/api/v1/profile", json=update_payload, headers=auth_headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["full_name"] == "Ankit Developer"

    # 3. Add skill
    skill_payload = {"name": "FastAPI", "category": "Frameworks", "proficiency": "Advanced"}
    skill_res = await async_client.post("/api/v1/profile/skills", json=skill_payload, headers=auth_headers)
    assert skill_res.status_code == 201
    skills = skill_res.json()["data"]["skills"]
    assert any(s["name"] == "FastAPI" for s in skills)
    skill_id = skills[0]["id"]

    # 4. Add project
    proj_payload = {
        "name": "AI Career Assistant",
        "description": "Multi-agent career platform",
        "technologies": ["Python", "FastAPI", "MongoDB"],
        "github_url": "https://github.com/example/ai-agent",
    }
    proj_res = await async_client.post("/api/v1/profile/projects", json=proj_payload, headers=auth_headers)
    assert proj_res.status_code == 201
    projects = proj_res.json()["data"]["projects"]
    assert len(projects) == 1

    # 5. Delete skill
    del_res = await async_client.delete(f"/api/v1/profile/skills/{skill_id}", headers=auth_headers)
    assert del_res.status_code == 200
    assert len(del_res.json()["data"]["skills"]) == 0


@pytest.mark.asyncio
async def test_unauthorized_profile_access(async_client: AsyncClient):
    res = await async_client.get("/api/v1/profile")
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "NOT_AUTHENTICATED"
