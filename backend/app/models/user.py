from datetime import datetime, timezone
from typing import Optional
from beanie import Document, Indexed
from pydantic import EmailStr, Field


class UserDocument(Document):
    email: Indexed(EmailStr, unique=True)
    hashed_password: str
    is_active: bool = True
    is_verified: bool = False
    role: str = "user"  # "user", "admin"
    verification_token: Optional[str] = None
    reset_password_token: Optional[str] = None
    reset_password_expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
        use_state_management = True
        indexes = [
            "email",
            "created_at",
        ]

    def update_timestamp(self):
        self.updated_at = datetime.now(timezone.utc)
