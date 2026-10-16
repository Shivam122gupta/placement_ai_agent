import pytest
from httpx import AsyncClient
from datetime import datetime, timezone, timedelta
from app.models.user import UserDocument
from app.core.security import hash_token


def _ensure_utc(dt):
    if dt is None:
        return None
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


@pytest.mark.asyncio
async def test_full_secure_auth_lifecycle(async_client: AsyncClient):
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
    assert reg_json["data"]["user"]["email"] == "newcandidate@placement.com"
    assert reg_json["data"]["user"]["is_verified"] is False

    # Verify user record has token hash and expiration in DB
    user = await UserDocument.find_one({"email": "newcandidate@placement.com"})
    assert user is not None
    assert user.verification_token is not None
    assert user.verification_token_expires_at is not None
    assert _ensure_utc(user.verification_token_expires_at) > datetime.now(timezone.utc)
    assert user.token_version == 1

    # 2. Prevent duplicate registration
    dup_res = await async_client.post("/api/v1/auth/register", json=register_payload)
    assert dup_res.status_code == 409
    assert dup_res.json()["error"]["code"] == "EMAIL_ALREADY_EXISTS"

    # 3. Email verification enforcement: Unverified user cannot log in
    login_payload = {
        "email": "newcandidate@placement.com",
        "password": "StrongPassword123!",
    }
    unverified_login = await async_client.post("/api/v1/auth/login", json=login_payload)
    assert unverified_login.status_code == 401
    assert unverified_login.json()["error"]["code"] == "EMAIL_NOT_VERIFIED"

    # 4. Verify email using token
    # Simulate email token: set a known raw token and its SHA-256 hash in DB
    test_raw_token = "secure_verify_token_xyz_12345"
    user.verification_token = hash_token(test_raw_token)
    user.verification_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    await user.save()

    verify_res = await async_client.post("/api/v1/auth/verify-email", json={"token": test_raw_token})
    assert verify_res.status_code == 200
    assert verify_res.json()["success"] is True

    # Check user is now verified and token is cleared
    user = await UserDocument.find_one({"email": "newcandidate@placement.com"})
    assert user.is_verified is True
    assert user.verification_token is None

    # 5. Login successfully after email verification
    login_res = await async_client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_json = login_res.json()
    access_token = login_json["data"]["tokens"]["access_token"]
    refresh_token = login_json["data"]["tokens"]["refresh_token"]
    assert access_token is not None
    assert refresh_token is not None

    # 6. Authenticated /me request
    me_res = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert me_res.status_code == 200
    assert me_res.json()["data"]["email"] == "newcandidate@placement.com"

    # 7. Token refresh rotation
    refresh_res = await async_client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_res.status_code == 200
    ref_json = refresh_res.json()
    new_access_token = ref_json["data"]["access_token"]
    new_refresh_token = ref_json["data"]["refresh_token"]

    # Old refresh token should now be blacklisted
    stale_refresh = await async_client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert stale_refresh.status_code == 401
    assert stale_refresh.json()["error"]["code"] == "TOKEN_REVOKED"

    # 8. Logout revokes access token
    logout_res = await async_client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {new_access_token}"},
        json={"refresh_token": new_refresh_token}
    )
    assert logout_res.status_code == 200

    # Using the revoked access token should now be rejected immediately
    revoked_me = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {new_access_token}"}
    )
    assert revoked_me.status_code == 401
    assert revoked_me.json()["error"]["code"] == "TOKEN_REVOKED"


@pytest.mark.asyncio
async def test_login_invalid_credentials_and_account_lockout(async_client: AsyncClient):
    # Register candidate
    reg_payload = {
        "email": "lockout_candidate@test.com",
        "password": "StrongPassword123!",
        "full_name": "Lockout Candidate",
    }
    await async_client.post("/api/v1/auth/register", json=reg_payload)
    user = await UserDocument.find_one({"email": "lockout_candidate@test.com"})
    user.is_verified = True
    await user.save()

    # Failed attempts 1 to 4 should return INVALID_CREDENTIALS
    for i in range(4):
        res = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "lockout_candidate@test.com", "password": "WrongPassword1!"}
        )
        assert res.status_code == 401
        assert res.json()["error"]["code"] == "INVALID_CREDENTIALS"

    # 5th failed attempt triggers ACCOUNT_LOCKED
    res_lock = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "lockout_candidate@test.com", "password": "WrongPassword1!"}
    )
    assert res_lock.status_code == 401
    assert res_lock.json()["error"]["code"] == "ACCOUNT_LOCKED"

    # Even with correct password, locked account is blocked
    res_blocked = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "lockout_candidate@test.com", "password": "StrongPassword123!"}
    )
    assert res_blocked.status_code == 401
    assert res_blocked.json()["error"]["code"] == "ACCOUNT_LOCKED"


@pytest.mark.asyncio
async def test_password_reset_expiration_and_session_invalidation(async_client: AsyncClient):
    # Setup verified user
    reg_payload = {
        "email": "reset_user@test.com",
        "password": "OldPassword123!",
        "full_name": "Reset User",
    }
    await async_client.post("/api/v1/auth/register", json=reg_payload)
    user = await UserDocument.find_one({"email": "reset_user@test.com"})
    user.is_verified = True
    await user.save()

    # Login to obtain active session
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "reset_user@test.com", "password": "OldPassword123!"}
    )
    assert login_res.status_code == 200
    old_access_token = login_res.json()["data"]["tokens"]["access_token"]

    # Request password reset
    forgot_res = await async_client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "reset_user@test.com"}
    )
    assert forgot_res.status_code == 200

    # User in DB should have reset token hash and expiration
    user = await UserDocument.find_one({"email": "reset_user@test.com"})
    assert user.reset_password_token is not None
    assert user.reset_password_expires_at is not None

    # Test expired reset token
    raw_reset_token = "my_reset_token_secret_123"
    user.reset_password_token = hash_token(raw_reset_token)
    user.reset_password_expires_at = datetime.now(timezone.utc) - timedelta(minutes=5)  # Expired 5 mins ago
    await user.save()

    expired_res = await async_client.post(
        "/api/v1/auth/reset-password",
        json={"token": raw_reset_token, "new_password": "NewSecurePassword2026!"}
    )
    assert expired_res.status_code == 401
    assert expired_res.json()["error"]["code"] == "EXPIRED_RESET_TOKEN"

    # Reset with valid active token
    user.reset_password_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    await user.save()

    reset_res = await async_client.post(
        "/api/v1/auth/reset-password",
        json={"token": raw_reset_token, "new_password": "NewSecurePassword2026!"}
    )
    assert reset_res.status_code == 200

    # Old access token must now be invalid because token_version incremented
    old_session_check = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {old_access_token}"}
    )
    assert old_session_check.status_code == 401
    assert old_session_check.json()["error"]["code"] == "SESSION_INVALIDATED"

    # Login with new password succeeds
    new_login = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "reset_user@test.com", "password": "NewSecurePassword2026!"}
    )
    assert new_login.status_code == 200
