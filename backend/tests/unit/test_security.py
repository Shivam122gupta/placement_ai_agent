import pytest
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    hash_token,
    generate_secure_token,
    constant_time_dummy_verify,
)
from app.schemas.auth import validate_password_complexity, UserResponse
from app.core.token_blacklist import blacklist_token, is_blacklisted


def test_password_hashing_and_verification():
    plain_password = "SecurePassword2026!"
    hashed = get_password_hash(plain_password)
    
    assert hashed != plain_password
    assert verify_password(plain_password, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False


def test_password_hashing_long_password():
    # Passwords longer than 72 bytes should not silently truncate or fail
    long_password = "VeryLongSecretPassword123!AndMoreEntropy" * 3  # > 100 bytes
    hashed = get_password_hash(long_password)
    
    assert verify_password(long_password, hashed) is True
    assert verify_password(long_password + "X", hashed) is False


def test_password_complexity_validator():
    # Valid password
    assert validate_password_complexity("ValidPass123!") == "ValidPass123!"

    # Too short (< 8 chars)
    with pytest.raises(ValueError, match="at least 8 characters"):
        validate_password_complexity("Sh0rt!")

    # Missing uppercase
    with pytest.raises(ValueError, match="uppercase"):
        validate_password_complexity("lowercase123!")

    # Missing lowercase
    with pytest.raises(ValueError, match="lowercase"):
        validate_password_complexity("UPPERCASE123!")

    # Missing digit
    with pytest.raises(ValueError, match="digit"):
        validate_password_complexity("NoDigitsHere!")

    # Missing special character
    with pytest.raises(ValueError, match="special character"):
        validate_password_complexity("NoSpecialChar123")


def test_token_hashing_and_generation():
    token1 = generate_secure_token()
    token2 = generate_secure_token()
    assert token1 != token2
    assert len(token1) >= 40  # URL-safe base64 of 32 bytes

    hash1 = hash_token(token1)
    hash2 = hash_token(token1)
    assert hash1 == hash2
    assert hash1 != token1
    assert len(hash1) == 64  # SHA-256 hex digest length


def test_constant_time_dummy_verify():
    # Should run smoothly without throwing exceptions
    constant_time_dummy_verify("any_password_attempt_123")


def test_access_token_creation_and_decoding():
    user_id = "507f1f77bcf86cd799439011"
    token = create_access_token(subject=user_id, token_version=2)
    
    payload = decode_access_token(token)
    assert payload["sub"] == user_id
    assert payload["type"] == "access"
    assert payload["ver"] == 2
    assert "exp" in payload
    assert "iat" in payload


def test_refresh_token_creation_and_decoding():
    user_id = "507f1f77bcf86cd799439011"
    token = create_refresh_token(subject=user_id, token_version=3)
    
    payload = decode_refresh_token(token)
    assert payload["sub"] == user_id
    assert payload["type"] == "refresh"
    assert payload["ver"] == 3
    assert "exp" in payload
    assert "iat" in payload


def test_token_blacklist_revocation():
    test_token = generate_secure_token()
    assert is_blacklisted(test_token) is False
    
    blacklist_token(test_token, ttl_seconds=60)
    assert is_blacklisted(test_token) is True


def test_user_response_schema_does_not_expose_secrets():
    # Verify UserResponse never leaks hashed_password, tokens, or private secrets
    resp = UserResponse(
        id="507f1f77bcf86cd799439011",
        email="candidate@test.com",
        role="user",
        is_active=True,
        is_verified=True,
        created_at="2026-10-16T00:00:00Z"
    )
    dumped = resp.model_dump()
    forbidden_keys = [
        "hashed_password",
        "password",
        "verification_token",
        "reset_password_token",
        "jwt_secret",
        "secret",
    ]
    for key in forbidden_keys:
        assert key not in dumped, f"Sensitive key {key} leaked in UserResponse!"
