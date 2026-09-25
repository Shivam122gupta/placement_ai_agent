from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl
from app.models.profile import EducationItem, SkillItem, ProjectItem, CertificationItem


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    target_roles: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    experience_level: Optional[str] = None
    work_preference: Optional[str] = None
    employment_type: Optional[str] = None


class EducationCreateRequest(BaseModel):
    degree: str
    college: str
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = None


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
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    target_roles: List[str]
    preferred_locations: List[str]
    experience_level: str
    work_preference: str
    employment_type: str
    education: List[EducationItem]
    skills: List[SkillItem]
    projects: List[ProjectItem]
    certifications: List[CertificationItem]
    completion_score: int
    created_at: str
    updated_at: str
