from datetime import datetime, timezone
from typing import Optional
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field


class NotificationDocument(Document):
    user_id: Indexed(PydanticObjectId)
    title: str
    message: str
    type: str = "STATUS_UPDATE"  # "JOB_ALERT", "INTERVIEW_REMINDER", "STATUS_UPDATE", "DEADLINE", "AGENT_ACTION"
    is_read: bool = False
    link_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "notifications"
        use_state_management = True
        indexes = [
            "user_id",
            "is_read",
            "created_at",
        ]
