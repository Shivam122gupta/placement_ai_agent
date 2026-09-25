from datetime import datetime, timezone
from typing import Optional, Dict, Any
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from app.schemas.resume import ParsedResumeSchema


class ResumeDocument(Document):
    user_id: Indexed(PydanticObjectId)
    filename: str
    file_path: str
    file_size: int
    mime_type: str
    status: str = "PROCESSING"  # "PROCESSING", "COMPLETED", "FAILED"
    checksum: Indexed(str)
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "resumes"
        use_state_management = True
        indexes = [
            "user_id",
            "checksum",
            "created_at",
        ]

    def update_timestamp(self):
        self.updated_at = datetime.now(timezone.utc)


class ResumeVersionDocument(Document):
    resume_id: Indexed(PydanticObjectId)
    user_id: Indexed(PydanticObjectId)
    version_number: int = 1
    parsed_data: ParsedResumeSchema
    raw_text: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "resume_versions"
        use_state_management = True
        indexes = [
            "resume_id",
            "user_id",
            "version_number",
        ]
