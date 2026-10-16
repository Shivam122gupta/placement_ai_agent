import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


from app.core.sanitizer import sanitize_text
from app.core.config import settings


def validate_password_complexity(v: str) -> str:
    """
    Enforces enterprise password complexity standards:
    - Between 8 and 128 characters
    - At least 1 uppercase ASCII letter
    - At least 1 lowercase ASCII letter
    - At least 1 digit
    - At least 1 special symbol
    """
    if len(v) < settings.PASSWORD_MIN_LENGTH:
        raise ValueError(f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long")
    if len(v) > settings.PASSWORD_MAX_LENGTH:
        raise ValueError(f"Password cannot exceed {settings.PASSWORD_MAX_LENGTH} characters")
    if not re.search(r"[A-Z]", v):
        raise ValueError("Password must contain at least one uppercase letter (A-Z)")
    if not re.search(r"[a-z]", v):
        raise ValueError("Password must contain at least one lowercase letter (a-z)")
    if not re.search(r"\d", v):
        raise ValueError("Password must contain at least one digit (0-9)")
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?`~]", v):
        raise ValueError("Password must contain at least one special character (!@#$%^&* etc.)")
    return v


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128, description="Password must meet complexity criteria")
    full_name: Optional[str] = Field(default="", max_length=100)

    @field_validator("full_name")
    @classmethod
    def sanitize_name(cls, v: Optional[str]) -> str:
        return sanitize_text(v or "")

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        return validate_password_complexity(v)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None  # Client should send this so it can be blacklisted
    access_token: Optional[str] = None   # Optional direct access token revocation


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_reset_password_strength(cls, v: str) -> str:
        return validate_password_complexity(v)


class VerifyEmailRequest(BaseModel):
    token: str


class UserResponse(BaseModel):
    id: str
    email: str
    role: str = "user"
    is_active: bool
    is_verified: bool
    created_at: str
