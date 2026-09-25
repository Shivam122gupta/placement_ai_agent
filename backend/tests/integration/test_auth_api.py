import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_and_login_flow(async_client: AsyncClient):
    # 1. Register new candidate
    register_payload = {
        "email": "newcandidate@placement.com",
        "password": "StrongPassword123!",
        "full_name": "New Candidate",
    }
    reg_res = await async_client.post("/api/v1/auth/register", json=register_payload)
    assert reg_res.status_code == 201
    reg_json = reg_res.json()
    assert reg_json["success"] is True
    assert "access_token" in reg_json["data"]["tokens"]
    assert reg_json["data"]["user"]["email"] == "newcandidate@placement.com"

    # 2. Prevent duplicate registration
    dup_res = await async_client.post("/api/v1/auth/register", json=register_payload)
    assert dup_res.status_code == 409
    dup_json = dup_res.json()
    assert dup_json["error"]["code"] == "EMAIL_ALREADY_EXISTS"

    # 3. Login with correct credentials
    login_payload = {
        "email": "newcandidate@placement.com",
        "password": "StrongPassword123!",
    }
    login_res = await async_client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_json = login_res.json()
    assert "access_token" in login_json["data"]["tokens"]
    refresh_token = login_json["data"]["tokens"]["refresh_token"]

    # 4. Token refresh
    refresh_res = await async_client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_res.status_code == 200
    ref_json = refresh_res.json()
    assert "access_token" in ref_json["data"]


@pytest.mark.asyncio
async def test_login_invalid_credentials(async_client: AsyncClient):
    res = await async_client.post("/api/v1/auth/login", json={"email": "nobody@test.com", "password": "WrongPassword!"})
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "INVALID_CREDENTIALS"
