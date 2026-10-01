import uuid
from typing import List, Optional, Any
from pydantic import BaseModel, Field, model_validator


class ParsedEducation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    degree: str
    college: str = "Unknown Institution"
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Map common aliases
            if "college" not in data:
                data["college"] = data.get("institution") or data.get("university") or data.get("school") or "Unknown Institution"
            if "graduation_year" not in data and "year" in data:
                try:
                    data["graduation_year"] = int(str(data["year"]).strip())
                except (ValueError, TypeError):
                    pass
        return data


class ParsedSkill(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str = "General"
    proficiency: Optional[str] = "Intermediate"

    @model_validator(mode="before")
    @classmethod
    def normalize_skill(cls, data: Any) -> Any:
        if isinstance(data, str):
            return {"name": data.strip(), "category": "General", "proficiency": "Intermediate"}
        return data


class ParsedExperience(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company: str
    role: str
    duration: Optional[str] = None
    location: Optional[str] = None
    highlights: List[str] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def normalize_experience(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "company" not in data and "organization" in data:
                data["company"] = data["organization"]
            if "role" not in data and "title" in data:
                data["role"] = data["title"]
        return data


class ParsedProject(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    technologies: List[str] = Field(default_factory=list)
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    role: Optional[str] = "Developer"

    @model_validator(mode="before")
    @classmethod
    def normalize_project(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "name" not in data:
                data["name"] = data.get("title") or data.get("project_name") or "Untitled Project"
            if "description" not in data:
                data["description"] = data.get("details") or data.get("summary") or ""
        return data


class ParsedCertification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    issuer: str = "Self / Online"
    issue_date: Optional[str] = None
    credential_url: Optional[str] = None


class ParsedResumeSchema(BaseModel):
    full_name: Optional[str] = ""
    headline: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    summary: Optional[str] = None
    education: List[ParsedEducation] = Field(default_factory=list)
    skills: List[ParsedSkill] = Field(default_factory=list)
    experience: List[ParsedExperience] = Field(default_factory=list)
    projects: List[ParsedProject] = Field(default_factory=list)
    certifications: List[ParsedCertification] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def normalize_root(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Normalize skills if returned as flat list of strings
            if "skills" in data and isinstance(data["skills"], list):
                norm_skills = []
                for s in data["skills"]:
                    if isinstance(s, str):
                        norm_skills.append({"name": s.strip(), "category": "General"})
                    elif isinstance(s, dict):
                        norm_skills.append(s)
                data["skills"] = norm_skills
        return data


class ResumeVersionResponse(BaseModel):
    id: str
    resume_id: str
    version_number: int
    parsed_data: ParsedResumeSchema
    created_at: str


class ResumeResponse(BaseModel):
    id: str
    user_id: str
    filename: str
    file_size: int
    mime_type: str
    status: str  # "PROCESSING", "COMPLETED", "FAILED"
    checksum: str
    parsed_data: Optional[ParsedResumeSchema] = None
    created_at: str
    updated_at: str


class ProfileSyncRequest(BaseModel):
    sync_personal: bool = True
    sync_education: bool = True
    sync_skills: bool = True
    sync_projects: bool = True
    sync_experience: bool = True
    sync_certifications: bool = True
