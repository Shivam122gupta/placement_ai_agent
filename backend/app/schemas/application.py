from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.core.sanitizer import sanitize_text


class ApplicationCreate(BaseModel):
    job_id: Optional[str] = Field(default=None, max_length=50, description="Optional job ID if applying to an ingested job")
    company_name: Optional[str] = Field(default=None, max_length=150, description="Company name")
    job_title: Optional[str] = Field(default=None, max_length=150, description="Job title")
    status: str = Field(default="SAVED", max_length=30, description="Initial stage")
    applied_date: Optional[str] = Field(default=None, max_length=50)
    interview_date: Optional[str] = Field(default=None, max_length=50)
    next_action: Optional[str] = Field(default=None, max_length=200)
    next_action_date: Optional[str] = Field(default=None, max_length=50)
    notes: Optional[str] = Field(default=None, max_length=3000)
    salary_offered: Optional[str] = Field(default=None, max_length=100)
    location: Optional[str] = Field(default=None, max_length=100)

    @field_validator("company_name", "job_title", "next_action", "notes", "salary_offered", "location", mode="before")
    @classmethod
    def sanitize_input_text(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return sanitize_text(str(v))


class ApplicationUpdate(BaseModel):
    status: Optional[str] = Field(default=None, max_length=30)
    applied_date: Optional[str] = Field(default=None, max_length=50)
    interview_date: Optional[str] = Field(default=None, max_length=50)
    next_action: Optional[str] = Field(default=None, max_length=200)
    next_action_date: Optional[str] = Field(default=None, max_length=50)
    notes: Optional[str] = Field(default=None, max_length=3000)
    salary_offered: Optional[str] = Field(default=None, max_length=100)
    location: Optional[str] = Field(default=None, max_length=100)

    @field_validator("next_action", "notes", "salary_offered", "location", mode="before")
    @classmethod
    def sanitize_input_text(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return sanitize_text(str(v))



class ApplicationResponse(BaseModel):
    id: str
    user_id: str
    job_id: Optional[str] = None
    company_name: str
    job_title: str
    status: str
    applied_date: Optional[str] = None
    interview_date: Optional[str] = None
    next_action: Optional[str] = None
    next_action_date: Optional[str] = None
    notes: Optional[str] = None
    salary_offered: Optional[str] = None
    location: Optional[str] = None
    match_score: Optional[float] = None
    created_at: str
    updated_at: str


class PipelineStatsResponse(BaseModel):
    total_applications: int
    active_pipeline: int
    interviews_count: int
    offers_count: int
    status_counts: dict
    interview_conversion_rate: float
    offer_conversion_rate: float
