from typing import List, Optional, Any
from pydantic import BaseModel, Field, model_validator


class JobRequirementSchema(BaseModel):
    required_skills: List[str] = Field(default_factory=list, description="Mandatory technical skills strictly required")
    preferred_skills: List[str] = Field(default_factory=list, description="Nice-to-have or bonus skills")
    min_experience_years: float = Field(default=0.0, description="Minimum years of experience")
    max_experience_years: Optional[float] = None
    required_education: Optional[str] = "Bachelor's Degree in Computer Science, IT, or equivalent"
    responsibilities: List[str] = Field(default_factory=list)
    role_summary: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_skills_and_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Normalization of string lists from LLM
            req_keys = ["required_skills", "must_have", "skills", "technical_skills", "core_skills", "mandatory_skills", "key_skills"]
            for k in req_keys:
                if k in data and data[k] and not data.get("required_skills"):
                    val = data[k]
                    if isinstance(val, list):
                        data["required_skills"] = [str(x).strip() for x in val if x]
                    elif isinstance(val, str):
                        data["required_skills"] = [s.strip() for s in val.split(",") if s.strip()]

            pref_keys = ["preferred_skills", "nice_to_have", "good_to_have", "secondary_skills", "bonus_skills"]
            for k in pref_keys:
                if k in data and data[k] and not data.get("preferred_skills"):
                    val = data[k]
                    if isinstance(val, list):
                        data["preferred_skills"] = [str(x).strip() for x in val if x]
                    elif isinstance(val, str):
                        data["preferred_skills"] = [s.strip() for s in val.split(",") if s.strip()]

            if "experience" in data and "min_experience_years" not in data:
                try:
                    exp_val = str(data["experience"]).lower()
                    if "0" in exp_val or "fresher" in exp_val or "intern" in exp_val:
                        data["min_experience_years"] = 0.0
                    else:
                        digits = [float(s) for s in exp_val.split() if s.replace('.', '', 1).isdigit()]
                        data["min_experience_years"] = digits[0] if digits else 0.0
                except Exception:
                    data["min_experience_years"] = 0.0

            # Ensure lists
            if "required_skills" not in data or not data["required_skills"]:
                data["required_skills"] = []
            if "preferred_skills" not in data or not data["preferred_skills"]:
                data["preferred_skills"] = []

        return data


class JobSearchQuery(BaseModel):
    query: Optional[str] = ""
    location: Optional[str] = ""
    employment_type: Optional[str] = ""
    skills: Optional[List[str]] = None
    limit: Optional[int] = 20


class JobResponse(BaseModel):
    id: str
    title: str
    company: str
    location: str
    employment_type: str
    description_raw: str
    source: str
    source_url: Optional[str] = None
    dedup_hash: str
    requirements: JobRequirementSchema
    posted_at: Optional[str] = None
    discovered_at: str
    last_verified_at: str


class JDAnalysisRequest(BaseModel):
    raw_text: str = Field(..., min_length=20, description="Raw job description text to parse")
    title: Optional[str] = "Untitled Role"
    company: Optional[str] = "Undisclosed Company"


class JDAnalysisResponse(BaseModel):
    title: str
    company: str
    raw_text: str
    requirements: JobRequirementSchema
