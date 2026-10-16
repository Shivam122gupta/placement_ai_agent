from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from app.models.profile import EducationItem, SkillItem, ProjectItem, CertificationItem, ExperienceItem
from app.core.sanitizer import sanitize_text, is_safe_url


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
    target_roles: Optional[List[str]] = Field(None, max_length=20)
    preferred_locations: Optional[List[str]] = Field(None, max_length=20)
    experience_level: Optional[str] = Field(None, max_length=50)
    work_preference: Optional[str] = Field(None, max_length=50)
    employment_type: Optional[str] = Field(None, max_length=50)

    @field_validator("full_name", "headline", "bio", "location", "phone", mode="before")
    @classmethod
    def sanitize_text_fields(cls, v):
        if v is None:
            return v
        return sanitize_text(str(v))

    @field_validator("linkedin_url", "github_url", "portfolio_url")
    @classmethod
    def validate_safe_urls(cls, v: Optional[str]) -> Optional[str]:
        if v and not is_safe_url(v):
            raise ValueError("URL must use a valid protocol (http:// or https://)")
        return v


class EducationCreateRequest(BaseModel):
    degree: str = Field(..., min_length=1, max_length=150)
    college: str = Field(..., min_length=1, max_length=200)
    branch: Optional[str] = Field(None, max_length=150)
    graduation_year: Optional[int] = Field(None, ge=1950, le=2100)
    cgpa: Optional[float] = Field(None, ge=0.0, le=10.0)

    @field_validator("degree", "college", "branch", mode="before")
    @classmethod
    def sanitize_edu_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return sanitize_text(str(v))


class ExperienceCreateRequest(BaseModel):
    company: str = Field(..., min_length=1, max_length=150)
    role: str = Field(..., min_length=1, max_length=150)
    duration: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=100)
    highlights: List[str] = Field(default_factory=list, max_length=20)

    @field_validator("company", "role", "duration", "location", mode="before")
    @classmethod
    def sanitize_exp_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return sanitize_text(str(v))

    @field_validator("highlights", mode="before")
    @classmethod
    def sanitize_highlights(cls, v: List[str]) -> List[str]:
        if isinstance(v, list):
            return [sanitize_text(str(item), max_length=500) for item in v if item]
        return []


class SkillCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    category: Optional[str] = Field(default="General", max_length=50)
    proficiency: Optional[str] = Field(default="Intermediate", max_length=50)

    @field_validator("name", "category", "proficiency", mode="before")
    @classmethod
    def sanitize_skill_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return sanitize_text(str(v))


class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: str = Field(..., min_length=1, max_length=5000)
    technologies: List[str] = Field(default_factory=list, max_length=30)
    github_url: Optional[str] = Field(None, max_length=300)
    live_url: Optional[str] = Field(None, max_length=300)
    role: Optional[str] = Field(default="Developer", max_length=100)

    @field_validator("name", "description", "role", mode="before")
    @classmethod
    def sanitize_project_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return sanitize_text(str(v), allow_basic_formatting=True)

    @field_validator("technologies", mode="before")
    @classmethod
    def sanitize_technologies(cls, v: List[str]) -> List[str]:
        if isinstance(v, list):
            return [sanitize_text(str(tech), max_length=50) for tech in v if tech]
        return []

    @field_validator("github_url", "live_url")
    @classmethod
    def validate_project_urls(cls, v: Optional[str]) -> Optional[str]:
        if v and not is_safe_url(v):
            raise ValueError("Project URL must use a safe protocol (http:// or https://)")
        return v


class CertificationCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    issuer: str = Field(..., min_length=1, max_length=150)
    issue_date: Optional[str] = Field(None, max_length=50)
    credential_url: Optional[str] = Field(None, max_length=300)

    @field_validator("name", "issuer", "issue_date", mode="before")
    @classmethod
    def sanitize_cert_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return sanitize_text(str(v))

    @field_validator("credential_url")
    @classmethod
    def validate_cert_url(cls, v: Optional[str]) -> Optional[str]:
        if v and not is_safe_url(v):
            raise ValueError("Credential URL must use http:// or https://")
        return v


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
