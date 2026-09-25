import uuid
from datetime import datetime, timezone
from typing import List, Optional
from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field


class EducationItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    degree: str
    college: str
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = None


class SkillItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str = "General"  # Programming Languages, Frameworks, Databases, Cloud, AI/ML, DevOps, Other
    proficiency: Optional[str] = "Intermediate"  # Beginner, Intermediate, Advanced, Expert


class ProjectItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    technologies: List[str] = Field(default_factory=list)
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    role: Optional[str] = "Developer"


class CertificationItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    issuer: str
    issue_date: Optional[str] = None
    credential_url: Optional[str] = None


class ProfileDocument(Document):
    user_id: Indexed(PydanticObjectId, unique=True)
    full_name: str = ""
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    
    # Career Preferences
    target_roles: List[str] = Field(default_factory=list)
    preferred_locations: List[str] = Field(default_factory=list)
    experience_level: str = "0-1 years"  # Fresher / 0-1 years / 1-3 years
    work_preference: str = "Flexible"   # Remote / Hybrid / On-site / Flexible
    employment_type: str = "Internship / Full-time"  # Internship, Full-time, Both
    
    # Nested Sub-Entities
    education: List[EducationItem] = Field(default_factory=list)
    skills: List[SkillItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    certifications: List[CertificationItem] = Field(default_factory=list)
    
    # Profile Score & Metadata
    completion_score: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "profiles"
        use_state_management = True
        indexes = [
            "user_id",
            "target_roles",
            "completion_score",
        ]

    def update_timestamp(self):
        self.updated_at = datetime.now(timezone.utc)
