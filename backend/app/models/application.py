from datetime import datetime, timezone
from typing import Optional
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field


class ApplicationDocument(Document):
    user_id: Indexed(PydanticObjectId)
    job_id: Optional[Indexed(PydanticObjectId)] = None
    company_name: str
    job_title: str
    status: str = "SAVED"  # "SAVED", "APPLIED", "ASSESSMENT", "SHORTLISTED", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"
    applied_date: Optional[datetime] = None
    interview_date: Optional[datetime] = None
    next_action: Optional[str] = None
    next_action_date: Optional[datetime] = None
    notes: Optional[str] = None
    salary_offered: Optional[str] = None
    location: Optional[str] = None
    match_score: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "applications"
        use_state_management = True
        indexes = [
            "user_id",
            "status",
            "job_id",
            [("user_id", 1), ("job_id", 1)],
            "created_at",
        ]

    def update_timestamp(self):
        self.updated_at = datetime.now(timezone.utc)
