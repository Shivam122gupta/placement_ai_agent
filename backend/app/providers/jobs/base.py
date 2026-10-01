from abc import ABC, abstractmethod
from typing import List, Optional
from pydantic import BaseModel, Field


class RawJobItem(BaseModel):
    title: str
    company: str
    location: str
    employment_type: str = "Internship"  # "Internship", "Full-time", "Contract"
    description_raw: str
    source: str = "PlacementPlatform"
    source_url: Optional[str] = None
    min_experience_years: float = 0.0
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    posted_at: Optional[str] = None


class BaseJobProvider(ABC):
    @abstractmethod
    async def search_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        employment_type: Optional[str] = None,
        skills: Optional[List[str]] = None,
        limit: int = 20,
    ) -> List[RawJobItem]:
        """Fetch raw job postings matching search criteria."""
        pass
