import pytest
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
)


def test_password_hashing_and_verification():
    plain_password = "SecurePassword2026!"
    hashed = get_password_hash(plain_password)
    
    assert hashed != plain_password
    assert verify_password(plain_password, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False


def test_access_token_creation_and_decoding():
    user_id = "507f1f77bcf86cd799439011"
    token = create_access_token(subject=user_id)
    
    payload = decode_access_token(token)
    assert payload["sub"] == user_id
    assert payload["type"] == "access"
    assert "exp" in payload


def test_refresh_token_creation_and_decoding():
    user_id = "507f1f77bcf86cd799439011"
    token = create_refresh_token(subject=user_id)
    
    payload = decode_refresh_token(token)
    assert payload["sub"] == user_id
    assert payload["type"] == "refresh"
    assert "exp" in payload
