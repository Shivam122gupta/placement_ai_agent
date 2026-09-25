from datetime import datetime, timezone
from typing import List, Optional
from beanie import Document, Indexed
from pydantic import BaseModel, Field
from app.schemas.job import JobRequirementSchema


class JobDocument(Document):
    title: str
    company: str
    location: str
    employment_type: str = "Internship"  # "Internship", "Full-time", "Contract"
    description_raw: str
    source: str = "PlacementPlatform"
    source_url: Optional[str] = None
    dedup_hash: Indexed(str, unique=True)
    requirements: JobRequirementSchema
    
    posted_at: Optional[datetime] = None
    discovered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_verified_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None

    class Settings:
        name = "jobs"
        use_state_management = True
        indexes = [
            "dedup_hash",
            "title",
            "company",
            "location",
            "employment_type",
            "discovered_at",
        ]

    def update_verification_timestamp(self):
        self.last_verified_at = datetime.now(timezone.utc)
