import re
import logging
from datetime import datetime, timezone
from typing import List, Dict, Set, Tuple, Optional
from beanie import PydanticObjectId

from app.models.matching import JobMatchDocument, SkillMatchDetail
from app.models.profile import ProfileDocument
from app.models.job import JobDocument
from app.schemas.matching import JobMatchResponse, LLMMatchReasoningOutput
from app.providers.llm import get_llm_provider
from app.core.exceptions import ResourceNotFoundError

logger = logging.getLogger("app.services.matching")

# Standardized synonyms & alias mapping
SKILL_ALIASES: Dict[str, str] = {
    "js": "javascript",
    "javascript": "javascript",
    "ts": "typescript",
    "typescript": "typescript",
    "py": "python",
    "python": "python",
    "react": "react",
    "reactjs": "react",
    "react.js": "react",
    "next": "nextjs",
    "nextjs": "nextjs",
    "next.js": "nextjs",
    "node": "nodejs",
    "nodejs": "nodejs",
    "node.js": "nodejs",
    "express": "express",
    "expressjs": "express",
    "fastapi": "fastapi",
    "flask": "flask",
    "django": "django",
    "postgres": "postgresql",
    "postgresql": "postgresql",
    "mongo": "mongodb",
    "mongodb": "mongodb",
    "docker": "docker",
    "k8s": "kubernetes",
    "kubernetes": "kubernetes",
    "aws": "aws",
    "amazon web services": "aws",
    "gcp": "gcp",
    "google cloud": "gcp",
    "azure": "azure",
    "git": "git",
    "github": "git",
    "graphql": "graphql",
    "rest": "rest api",
    "rest api": "rest api",
    "restful": "rest api",
    "sql": "sql",
    "nosql": "nosql",
    "redis": "redis",
    "ci/cd": "cicd",
    "cicd": "cicd",
    "html": "html",
    "html5": "html",
    "css": "css",
    "css3": "css",
    "tailwind": "tailwindcss",
    "tailwindcss": "tailwindcss",
    "c++": "cpp",
    "cpp": "cpp",
    "golang": "go",
    "go": "go",
    "java": "java",
    "spring": "springboot",
    "springboot": "springboot",
    "spring boot": "springboot",
}


class MatchingService:
    @staticmethod
    def normalize_skill(skill: str) -> str:
        """Strip special chars, lowercase, map synonyms."""
        if not skill:
            return ""
        s = skill.lower().strip()
        s_clean = re.sub(r"[^\w\s\+\#]", "", s).strip()
        return SKILL_ALIASES.get(s_clean, s_clean)

    @classmethod
    def extract_candidate_skills_and_evidence(cls, profile: ProfileDocument) -> Tuple[Set[str], Dict[str, str]]:
        """
        Extract normalized candidate skills and build an evidence dictionary mapping skill -> citation.
        """
        candidate_skills_set = set()
        evidence_map: Dict[str, str] = {}

        # 1. Direct skills in profile
        for sk in profile.skills:
            norm = cls.normalize_skill(sk.name)
            if norm:
                candidate_skills_set.add(norm)
                prof = f" ({sk.proficiency})" if sk.proficiency else ""
                evidence_map[norm] = f"Listed in Profile Skills: {sk.name}{prof}"

        # 2. Extract from Projects
        for proj in profile.projects:
            proj_name = proj.name
            proj_text = f"{proj_name}: {proj.description or ''}"
            for tech in proj.technologies:
                norm = cls.normalize_skill(tech)
                if norm:
                    candidate_skills_set.add(norm)
                    if norm not in evidence_map:
                        evidence_map[norm] = f"Built in Project: '{proj_name}'"

            for alias_key, canon_val in SKILL_ALIASES.items():
                if re.search(rf"\b{re.escape(alias_key)}\b", proj_text, re.IGNORECASE):
                    candidate_skills_set.add(canon_val)
                    if canon_val not in evidence_map:
                        evidence_map[canon_val] = f"Applied in Project: '{proj_name}'"

        return candidate_skills_set, evidence_map

    @classmethod
    def evaluate_skills_match(
        cls,
        required_skills: List[str],
        preferred_skills: List[str],
        candidate_skills: Set[str],
        evidence_map: Dict[str, str],
    ) -> Tuple[int, List[str], List[str], List[str], List[SkillMatchDetail]]:
        """
        Deterministic skill intersection calculation.
        Returns: (skills_score, matched_skills, missing_skills, partial_skills, details_list)
        """
        matched: List[str] = []
        missing: List[str] = []
        partial: List[str] = []
        details: List[SkillMatchDetail] = []

        total_weight = 0.0
        earned_weight = 0.0

        # 1. Process Required Skills (Weight: 1.0 each)
        for req in required_skills:
            if not req.strip():
                continue
            norm_req = cls.normalize_skill(req)
            total_weight += 1.0

            if norm_req in candidate_skills:
                earned_weight += 1.0
                matched.append(req)
                details.append(SkillMatchDetail(
                    skill=req,
                    is_required=True,
                    matched=True,
                    evidence_snippet=evidence_map.get(norm_req, "Verified in candidate profile"),
                    confidence=1.0,
                ))
            else:
                # Check for partial / fuzzy match
                found_partial = False
                for cand_s in candidate_skills:
                    if (cand_s in norm_req or norm_req in cand_s) and len(cand_s) > 2:
                        found_partial = True
                        break
                
                if found_partial:
                    earned_weight += 0.5
                    partial.append(req)
                    details.append(SkillMatchDetail(
                        skill=req,
                        is_required=True,
                        matched=False,
                        evidence_snippet="Related experience identified",
                        confidence=0.5,
                    ))
                else:
                    missing.append(req)
                    details.append(SkillMatchDetail(
                        skill=req,
                        is_required=True,
                        matched=False,
                        evidence_snippet=None,
                        confidence=0.0,
                    ))

        # 2. Process Preferred Skills (Weight: 0.4 each)
        for pref in preferred_skills:
            if not pref.strip():
                continue
            norm_pref = cls.normalize_skill(pref)
            total_weight += 0.4

            if norm_pref in candidate_skills:
                earned_weight += 0.4
                matched.append(pref)
                details.append(SkillMatchDetail(
                    skill=pref,
                    is_required=False,
                    matched=True,
                    evidence_snippet=evidence_map.get(norm_pref, "Bonus skill verified"),
                    confidence=1.0,
                ))
            else:
                missing.append(pref)
                details.append(SkillMatchDetail(
                    skill=pref,
                    is_required=False,
                    matched=False,
                    evidence_snippet=None,
                    confidence=0.0,
                ))

        if total_weight == 0:
            skills_score = 100
        else:
            skills_score = int(round((earned_weight / total_weight) * 100))

        return min(100, max(0, skills_score)), matched, missing, partial, details

    @classmethod
    def evaluate_experience_score(cls, profile: ProfileDocument, job: JobDocument) -> int:
        req_exp = job.requirements.min_experience_years if job.requirements else 0.0
        
        # Parse experience level from profile (e.g. "0-1 years" -> 1.0, "1-3 years" -> 2.0, "Fresher" -> 0.5)
        level_str = (profile.experience_level or "").lower()
        if "fresher" in level_str or "0" in level_str:
            cand_exp = 0.5
        elif "1-3" in level_str:
            cand_exp = 2.0
        elif "3-5" in level_str:
            cand_exp = 4.0
        else:
            cand_exp = 1.0

        if req_exp == 0.0 or cand_exp >= req_exp:
            return 100
        
        ratio = cand_exp / req_exp
        return int(max(20, min(100, round(ratio * 100))))

    @classmethod
    async def generate_grounded_reasoning(
        cls,
        profile: ProfileDocument,
        job: JobDocument,
        matched_skills: List[str],
        missing_skills: List[str],
        overall_score: int,
    ) -> LLMMatchReasoningOutput:
        llm = get_llm_provider()
        
        prompt = (
            f"Analyze candidate fit for {job.title} at {job.company}.\n\n"
            f"Match Score: {overall_score}%\n"
            f"Matched Skills ({len(matched_skills)}): {', '.join(matched_skills) if matched_skills else 'None'}\n"
            f"Missing Skills ({len(missing_skills)}): {', '.join(missing_skills) if missing_skills else 'None'}\n"
            f"Candidate Experience Level: {profile.experience_level}\n"
            f"Projects: {', '.join([p.name for p in profile.projects]) if profile.projects else 'None'}\n\n"
            f"Generate an objective, recruiter-style fit evaluation."
        )
        system_prompt = (
            "You are a Senior Technical Recruiter. Provide an honest, grounded evaluation. "
            "Never fabricate candidate skills not present in the input. If required skills are missing, clearly list them as gaps."
        )

        try:
            res = await llm.generate_structured_output(
                schema=LLMMatchReasoningOutput,
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.0,
            )
            return res
        except Exception as e:
            logger.warning(f"LLM grounded reasoning fallback due to error: {e}")
            # Heuristic grounded fallback
            strengths = [f"Strong background in {s}" for s in matched_skills[:3]] if matched_skills else ["Eager entry-level candidate"]
            key_gaps = [f"Needs to acquire {s}" for s in missing_skills[:4]] if missing_skills else []
            summary = (
                f"Candidate matches {overall_score}% of the target requirements for {job.title}. "
                f"Demonstrated competency in {len(matched_skills)} skills with {len(missing_skills)} gap areas to bridge."
            )
            return LLMMatchReasoningOutput(
                summary_reasoning=summary,
                strengths=strengths,
                key_gaps=key_gaps,
                recommended_focus_area=missing_skills[0] if missing_skills else "Interview Preparation",
            )

    @classmethod
    async def match_candidate_to_job(cls, user_id: PydanticObjectId, job_id: PydanticObjectId) -> JobMatchResponse:
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == user_id)
        if not profile:
            raise ResourceNotFoundError("Profile for user", str(user_id))

        job = await JobDocument.get(job_id)
        if not job:
            raise ResourceNotFoundError("Job", str(job_id))

        req_skills = job.requirements.required_skills if job.requirements else []
        pref_skills = job.requirements.preferred_skills if job.requirements else []

        candidate_skills, evidence_map = cls.extract_candidate_skills_and_evidence(profile)
        skills_score, matched_skills, missing_skills, partial_skills, details = cls.evaluate_skills_match(
            required_skills=req_skills,
            preferred_skills=pref_skills,
            candidate_skills=candidate_skills,
            evidence_map=evidence_map,
        )

        experience_score = cls.evaluate_experience_score(profile, job)

        # Weighted calculation: 60% skills + 40% experience
        overall_score = int(round((0.60 * skills_score) + (0.40 * experience_score)))

        reasoning_output = await cls.generate_grounded_reasoning(
            profile=profile,
            job=job,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            overall_score=overall_score,
        )

        now = datetime.now(timezone.utc)
        # Update or Insert JobMatchDocument
        existing_match = await JobMatchDocument.find_one(
            JobMatchDocument.user_id == user_id,
            JobMatchDocument.job_id == job_id,
        )

        if existing_match:
            existing_match.overall_score = overall_score
            existing_match.skills_score = skills_score
            existing_match.experience_score = experience_score
            existing_match.matched_skills = matched_skills
            existing_match.missing_skills = missing_skills
            existing_match.partial_skills = partial_skills
            existing_match.skill_details = details
            existing_match.summary_reasoning = reasoning_output.summary_reasoning
            existing_match.strengths = reasoning_output.strengths
            existing_match.key_gaps = reasoning_output.key_gaps
            existing_match.updated_at = now
            await existing_match.save()
            match_doc = existing_match
        else:
            match_doc = JobMatchDocument(
                user_id=user_id,
                job_id=job_id,
                overall_score=overall_score,
                skills_score=skills_score,
                experience_score=experience_score,
                matched_skills=matched_skills,
                missing_skills=missing_skills,
                partial_skills=partial_skills,
                skill_details=details,
                summary_reasoning=reasoning_output.summary_reasoning,
                strengths=reasoning_output.strengths,
                key_gaps=reasoning_output.key_gaps,
                created_at=now,
                updated_at=now,
            )
            await match_doc.insert()

        return cls._to_match_response(match_doc)

    @classmethod
    async def get_match_by_job(cls, user_id: PydanticObjectId, job_id: PydanticObjectId) -> Optional[JobMatchResponse]:
        match = await JobMatchDocument.find_one(
            JobMatchDocument.user_id == user_id,
            JobMatchDocument.job_id == job_id,
        )
        if not match:
            # If not yet matched, run match on the fly
            return await cls.match_candidate_to_job(user_id, job_id)
        return cls._to_match_response(match)

    @classmethod
    async def get_top_recommended_jobs(cls, user_id: PydanticObjectId, limit: int = 5) -> List[Dict]:
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == user_id)
        if not profile:
            return []

        jobs = await JobDocument.find_all().limit(20).to_list()
        results = []
        for job in jobs:
            match_res = await cls.get_match_by_job(user_id, job.id)
            results.append({
                "job_id": str(job.id),
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "employment_type": job.employment_type,
                "overall_score": match_res.overall_score,
                "matched_count": len(match_res.matched_skills),
                "missing_count": len(match_res.missing_skills),
            })

        results.sort(key=lambda x: x["overall_score"], reverse=True)
        return results[:limit]

    @staticmethod
    def _to_match_response(match: JobMatchDocument) -> JobMatchResponse:
        return JobMatchResponse(
            id=str(match.id),
            user_id=str(match.user_id),
            job_id=str(match.job_id),
            overall_score=match.overall_score,
            skills_score=match.skills_score,
            experience_score=match.experience_score,
            matched_skills=match.matched_skills,
            missing_skills=match.missing_skills,
            partial_skills=match.partial_skills,
            skill_details=[
                {
                    "skill": d.skill,
                    "is_required": d.is_required,
                    "matched": d.matched,
                    "evidence_snippet": d.evidence_snippet,
                    "confidence": d.confidence,
                }
                for d in match.skill_details
            ],
            summary_reasoning=match.summary_reasoning,
            strengths=match.strengths,
            key_gaps=match.key_gaps,
            created_at=match.created_at.isoformat(),
            updated_at=match.updated_at.isoformat(),
        )
