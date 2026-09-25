from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ApplicationCreate(BaseModel):
    job_id: Optional[str] = Field(default=None, description="Optional job ID if applying to an ingested job")
    company_name: Optional[str] = Field(default=None, description="Company name (auto-filled if job_id provided)")
    job_title: Optional[str] = Field(default=None, description="Job title (auto-filled if job_id provided)")
    status: str = Field(default="SAVED", description="Initial stage: SAVED, APPLIED, ASSESSMENT, SHORTLISTED, INTERVIEW, OFFER, REJECTED, WITHDRAWN")
    applied_date: Optional[str] = None
    interview_date: Optional[str] = None
    next_action: Optional[str] = None
    next_action_date: Optional[str] = None
    notes: Optional[str] = None
    salary_offered: Optional[str] = None
    location: Optional[str] = None


class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    applied_date: Optional[str] = None
    interview_date: Optional[str] = None
    next_action: Optional[str] = None
    next_action_date: Optional[str] = None
    notes: Optional[str] = None
    salary_offered: Optional[str] = None
    location: Optional[str] = None


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
