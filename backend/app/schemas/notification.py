from typing import Optional
from pydantic import BaseModel, Field


class NotificationCreate(BaseModel):
    title: str = Field(..., max_length=200)
    message: str = Field(..., max_length=1000)
    type: str = Field(default="STATUS_UPDATE", description="JOB_ALERT, INTERVIEW_REMINDER, STATUS_UPDATE, DEADLINE, AGENT_ACTION")
    link_url: Optional[str] = None


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    is_read: bool
    link_url: Optional[str] = None
    created_at: str
