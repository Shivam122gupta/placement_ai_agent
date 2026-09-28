from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl, field_validator
from app.models.profile import EducationItem, SkillItem, ProjectItem, CertificationItem, ExperienceItem
from app.core.sanitizer import sanitize_text


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, max_length=150)
    headline: Optional[str] = Field(None, max_length=200)
    bio: Optional[str] = Field(None, max_length=2000)
    contact_email: Optional[str] = Field(None, max_length=150)
    phone: Optional[str] = Field(None, max_length=20)
    location: Optional[str] = Field(None, max_length=100)
    linkedin_url: Optional[str] = Field(None, max_length=300)
    github_url: Optional[str] = Field(None, max_length=300)
    portfolio_url: Optional[str] = Field(None, max_length=300)
    target_roles: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    experience_level: Optional[str] = Field(None, max_length=50)
    work_preference: Optional[str] = Field(None, max_length=50)
    employment_type: Optional[str] = Field(None, max_length=50)

    @field_validator("full_name", "headline", "bio", "location", mode="before")
    @classmethod
    def sanitize_text_fields(cls, v):
        if v is None:
            return v
        return sanitize_text(str(v))


class EducationCreateRequest(BaseModel):
    degree: str
    college: str
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = None


class ExperienceCreateRequest(BaseModel):
    company: str
    role: str
    duration: Optional[str] = None
    location: Optional[str] = None
    highlights: List[str] = Field(default_factory=list)


class SkillCreateRequest(BaseModel):
    name: str
    category: Optional[str] = "General"
    proficiency: Optional[str] = "Intermediate"


class ProjectCreateRequest(BaseModel):
    name: str
    description: str
    technologies: List[str] = Field(default_factory=list)
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    role: Optional[str] = "Developer"


class CertificationCreateRequest(BaseModel):
    name: str
    issuer: str
    issue_date: Optional[str] = None
    credential_url: Optional[str] = None


class ProfileResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    headline: Optional[str] = None
    bio: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    target_roles: List[str]
    preferred_locations: List[str]
    experience_level: str
    work_preference: str
    employment_type: str
    education: List[EducationItem]
    experience: List[ExperienceItem] = Field(default_factory=list)
    skills: List[SkillItem]
    projects: List[ProjectItem]
    certifications: List[CertificationItem]
    completion_score: int
    created_at: str
    updated_at: str
