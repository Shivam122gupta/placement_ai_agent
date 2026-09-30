import re
import hashlib
import logging
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from beanie import PydanticObjectId

from app.models.job import JobDocument
from app.schemas.job import (
    JobRequirementSchema,
    JobResponse,
    JobSearchQuery,
    JDAnalysisResponse,
)
from app.providers.jobs import get_job_provider
from app.providers.llm import get_llm_provider
from app.core.exceptions import ResourceNotFoundError, AppException

logger = logging.getLogger("app.services.job")


class JobService:
    @staticmethod
    def canonicalize_string(val: str) -> str:
        """Strip punctuation, lowercase, collapse whitespace for deduplication hashing."""
        if not val:
            return ""
        val = val.lower().strip()
        # Remove common corporate suffixes
        val = re.sub(r"\b(inc|llc|ltd|pvt|corp|corporation|technologies|solutions|labs)\b", "", val)
        val = re.sub(r"[^\w\s]", "", val)
        return re.sub(r"\s+", " ", val).strip()

    @classmethod
    def compute_dedup_hash(cls, company: str, title: str, location: str, source_url: Optional[str] = None) -> str:
        norm_company = cls.canonicalize_string(company)
        norm_title = cls.canonicalize_string(title)
        norm_loc = cls.canonicalize_string(location)
        url_part = (source_url or "").strip().lower()

        fingerprint = f"{norm_company}|{norm_title}|{norm_loc}|{url_part}"
        return hashlib.sha256(fingerprint.encode("utf-8")).hexdigest()

    @classmethod
    async def analyze_jd_text(cls, raw_text: str, title: Optional[str] = None, company: Optional[str] = None) -> JobRequirementSchema:
        llm = get_llm_provider()
        prompt = (
            f"Analyze this Job Description and extract structured requirements:\n"
            f"Job Title: {title or 'Software Developer'}\n"
            f"Company: {company or 'Tech Corp'}\n\n"
            f"--- BEGIN JOB DESCRIPTION ---\n{raw_text}\n--- END JOB DESCRIPTION ---"
        )
        system_prompt = (
            "You are an expert Technical Recruiter. Extract required vs preferred skills accurately into the JSON schema. "
            "Never invent skills not present in the JD."
        )

        try:
            req_schema = await llm.generate_structured_output(
                schema=JobRequirementSchema,
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.0,
            )
            return req_schema
        except Exception as e:
            logger.warning(f"LLM JD extraction failed ({e}), falling back to regex extraction.")
            # Safe heuristic fallback
            common_skills = ["python", "fastapi", "react", "typescript", "sql", "mongodb", "docker", "aws", "git", "java", "c++", "machine learning"]
            text_lower = raw_text.lower()
            detected = [s.title() for s in common_skills if s in text_lower]
            return JobRequirementSchema(
                required_skills=detected[:5] if detected else ["Software Development"],
                preferred_skills=detected[5:],
                min_experience_years=0.0,
                responsibilities=["Deliver high quality code", "Collaborate with team"],
            )

    @classmethod
    async def search_and_ingest(cls, search_query: JobSearchQuery) -> List[JobResponse]:
        provider = get_job_provider()
        raw_jobs = await provider.search_jobs(
            query=search_query.query or "",
            location=search_query.location or None,
            employment_type=search_query.employment_type or None,
            skills=search_query.skills,
            limit=search_query.limit or 20,
        )

        if not raw_jobs:
            return []

        # 1. Compute dedup hashes upfront
        hashes_map = {}
        for raw in raw_jobs:
            h = cls.compute_dedup_hash(
                company=raw.company,
                title=raw.title,
                location=raw.location,
                source_url=raw.source_url,
            )
            hashes_map[h] = raw

        all_hashes = list(hashes_map.keys())

        # 2. Batch query all existing jobs in 1 database round trip
        existing_jobs = await JobDocument.find({"dedup_hash": {"$in": all_hashes}}).to_list()
        existing_map = {j.dedup_hash: j for j in existing_jobs}

        now = datetime.now(timezone.utc)

        # 3. Bulk update verification timestamps for existing jobs in 1 database round trip
        if existing_jobs:
            existing_ids = [j.id for j in existing_jobs]
            await JobDocument.find({"_id": {"$in": existing_ids}}).update({"$set": {"last_verified_at": now}})

        results = []
        new_jobs_to_insert: List[JobDocument] = []

        for h, raw in hashes_map.items():
            if h in existing_map:
                e_job = existing_map[h]
                e_job.last_verified_at = now
                results.append(cls._to_job_response(e_job))
                continue

            # Parse JD requirements if not provided
            if not raw.required_skills:
                requirements = await cls.analyze_jd_text(
                    raw_text=raw.description_raw,
                    title=raw.title,
                    company=raw.company,
                )
            else:
                requirements = JobRequirementSchema(
                    required_skills=raw.required_skills,
                    preferred_skills=raw.preferred_skills,
                    min_experience_years=raw.min_experience_years,
                    responsibilities=["Build and maintain software features", "Write clean, tested code"],
                    role_summary=raw.description_raw[:200] + "..." if len(raw.description_raw) > 200 else raw.description_raw,
                )

            posted_date = datetime.fromisoformat(raw.posted_at) if raw.posted_at else now
            new_job = JobDocument(
                id=PydanticObjectId(),
                title=raw.title,
                company=raw.company,
                location=raw.location,
                employment_type=raw.employment_type,
                description_raw=raw.description_raw,
                source=raw.source,
                source_url=raw.source_url,
                dedup_hash=h,
                requirements=requirements,
                posted_at=posted_date,
                discovered_at=now,
                last_verified_at=now,
            )
            new_jobs_to_insert.append(new_job)

        # 4. Bulk insert new jobs in 1 database round trip
        if new_jobs_to_insert:
            await JobDocument.insert_many(new_jobs_to_insert)
            for j in new_jobs_to_insert:
                results.append(cls._to_job_response(j))

        return results

    @classmethod
    async def list_jobs(
        cls,
        query: Optional[str] = None,
        location: Optional[str] = None,
        employment_type: Optional[str] = None,
        limit: int = 20,
        skip: int = 0,
    ) -> List[JobResponse]:
        filters = []
        if query:
            regex_query = {"$regex": query, "$options": "i"}
            filters.append({"$or": [{"title": regex_query}, {"company": regex_query}, {"description_raw": regex_query}]})
        if location:
            filters.append({"location": {"$regex": location, "$options": "i"}})
        if employment_type:
            filters.append({"employment_type": {"$regex": employment_type, "$options": "i"}})

        if filters:
            query_filter = {"$and": filters} if len(filters) > 1 else filters[0]
            jobs = await JobDocument.find(query_filter).sort("-discovered_at").skip(skip).limit(limit).to_list()
        else:
            jobs = await JobDocument.find_all().sort("-discovered_at").skip(skip).limit(limit).to_list()

        # If database is completely empty on initial launch, auto-populate with seed mock jobs
        if not jobs and skip == 0:
            return await cls.search_and_ingest(JobSearchQuery(limit=20))

        return [cls._to_job_response(j) for j in jobs]

    @classmethod
    async def get_by_id(cls, job_id: PydanticObjectId) -> JobResponse:
        job = await JobDocument.get(job_id)
        if not job:
            raise ResourceNotFoundError("Job", str(job_id))
        return cls._to_job_response(job)

    @classmethod
    async def analyze_custom_jd(cls, raw_text: str, title: Optional[str] = None, company: Optional[str] = None) -> JDAnalysisResponse:
        if len(raw_text.strip()) < 20:
            raise AppException(status_code=422, code="JD_TEXT_TOO_SHORT", message="Job description text is too short to analyze.")

        requirements = await cls.analyze_jd_text(raw_text, title, company)
        return JDAnalysisResponse(
            title=title or "Analyzed Role",
            company=company or "Undisclosed Company",
            raw_text=raw_text,
            requirements=requirements,
        )

    @staticmethod
    def _to_job_response(job: JobDocument) -> JobResponse:
        return JobResponse(
            id=str(job.id),
            title=job.title,
            company=job.company,
            location=job.location,
            employment_type=job.employment_type,
            description_raw=job.description_raw,
            source=job.source,
            source_url=job.source_url,
            dedup_hash=job.dedup_hash,
            requirements=job.requirements,
            posted_at=job.posted_at.isoformat() if job.posted_at else None,
            discovered_at=job.discovered_at.isoformat(),
            last_verified_at=job.last_verified_at.isoformat(),
        )
