import logging
from datetime import datetime, timezone
from typing import List, Optional, Any
from beanie import PydanticObjectId

from app.models.skill_gap import SkillGapRoadmapDocument, RoadmapMilestone
from app.models.job import JobDocument
from app.schemas.skill_gap import (
    RoadmapGenerateRequest,
    SkillGapRoadmapResponse,
    LLMRoadmapOutput,
    RoadmapMilestoneSchema,
)
from app.providers.llm import get_llm_provider
from app.services.matching_service import MatchingService
from app.core.exceptions import ResourceNotFoundError, AppException

logger = logging.getLogger("app.services.skill_gap")


class SkillGapService:
    @classmethod
    async def generate_roadmap(
        cls,
        user_id: Any,
        request: RoadmapGenerateRequest,
    ) -> SkillGapRoadmapResponse:
        user_obj_id = PydanticObjectId(str(user_id)) if not isinstance(user_id, PydanticObjectId) else user_id
        gap_skills: List[str] = []
        target_role = request.target_role or "Software Engineer"
        job_obj_id: Optional[PydanticObjectId] = None

        if request.custom_gap_skills:
            gap_skills = [s.strip() for s in request.custom_gap_skills if s.strip()]
        elif request.job_id:
            try:
                job_obj_id = PydanticObjectId(request.job_id)
            except Exception:
                raise AppException(status_code=400, code="INVALID_ID", message="Invalid Job ID format")
            
            job = await JobDocument.get(job_obj_id)
            if not job:
                raise ResourceNotFoundError("Job", request.job_id)
            target_role = f"{job.title} at {job.company}"

            # Fetch or execute match to get exact missing gaps
            match_res = await MatchingService.get_match_by_job(user_obj_id, job_obj_id)
            gap_skills = match_res.missing_skills if match_res else []

            # If no missing skills found, use preferred skills or key required skills for mastery
            if not gap_skills and job.requirements:
                gap_skills = job.requirements.required_skills[:3] or ["System Design", "Cloud Deployment"]
        else:
            gap_skills = ["FastAPI", "Docker", "PostgreSQL", "Redis"]

        if not gap_skills:
            gap_skills = ["Software Engineering Best Practices", "Clean Architecture"]

        llm_roadmap = await cls._generate_llm_milestones(
            target_role=target_role,
            gap_skills=gap_skills,
            duration_type=request.duration_type,
        )

        now = datetime.now(timezone.utc)
        roadmap_doc = SkillGapRoadmapDocument(
            user_id=user_obj_id,
            job_id=job_obj_id,
            target_role=target_role,
            duration_type=request.duration_type,
            gap_skills=gap_skills,
            milestones=[
                RoadmapMilestone(
                    day_or_week=m.day_or_week,
                    title=m.title,
                    target_skills=m.target_skills,
                    key_topics=m.key_topics,
                    practice_project_idea=m.practice_project_idea,
                    recommended_resources=m.recommended_resources,
                    completed=False,
                )
                for m in llm_roadmap.milestones
            ],
            readiness_impact=llm_roadmap.readiness_impact,
            created_at=now,
            updated_at=now,
        )
        await roadmap_doc.insert()

        return cls._to_roadmap_response(roadmap_doc)

    @classmethod
    async def _generate_llm_milestones(
        cls,
        target_role: str,
        gap_skills: List[str],
        duration_type: str,
    ) -> LLMRoadmapOutput:
        llm = get_llm_provider()

        duration_desc = {
            "1_week": "1-Week Intensive Crash Course (Day 1-2, Day 3-4, Day 5-6, Day 7)",
            "2_weeks": "2-Week Project-Based Plan (Week 1 Fundamentals & Architecture, Week 2 Hands-on Feature & Interview Prep)",
            "1_month": "1-Month Comprehensive Mastery Plan (Week 1 Core, Week 2 Advanced, Week 3 End-to-End System, Week 4 Testing & Production Readiness)",
        }.get(duration_type, "2-Week Balanced Plan")

        prompt = (
            f"Generate a personalized technical study roadmap for the candidate.\n"
            f"Target Role: {target_role}\n"
            f"Missing / Gap Skills: {', '.join(gap_skills)}\n"
            f"Roadmap Duration: {duration_desc}\n\n"
            f"Ensure every milestone includes realistic practical projects, key topics, and official documentation resources."
        )

        system_prompt = (
            "You are a Principal Engineer and Technical Mentor. Create a structured step-by-step learning roadmap. "
            "Output must be actionable, detailed, and formatted to the JSON schema."
        )

        try:
            res = await llm.generate_structured_output(
                schema=LLMRoadmapOutput,
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.1,
            )
            return res
        except Exception as e:
            logger.warning(f"LLM roadmap generation error ({e}), using structured template generator.")
            return cls._fallback_roadmap(target_role, gap_skills, duration_type)

    @classmethod
    def _fallback_roadmap(cls, target_role: str, gap_skills: List[str], duration_type: str) -> LLMRoadmapOutput:
        milestones = []
        if duration_type == "1_week":
            milestones = [
                RoadmapMilestoneSchema(
                    day_or_week="Day 1-2",
                    title="Core Fundamentals & Syntax Setup",
                    target_skills=gap_skills[:2],
                    key_topics=["Core architecture", "Hello World & CLI tools", "Basic CRUD"],
                    practice_project_idea="Build an in-memory task manager CLI",
                    recommended_resources=["Official Documentation", "MDN Web Docs"],
                ),
                RoadmapMilestoneSchema(
                    day_or_week="Day 3-5",
                    title="Building Connected Feature & Integration",
                    target_skills=gap_skills,
                    key_topics=["Database integration", "API contracts", "Error handling"],
                    practice_project_idea=f"Build a miniature REST service utilizing {', '.join(gap_skills[:2])}",
                    recommended_resources=["FastAPI Docs", "PostgreSQL Official Guide"],
                ),
                RoadmapMilestoneSchema(
                    day_or_week="Day 6-7",
                    title="Deployment, Testing & Interview Drills",
                    target_skills=gap_skills,
                    key_topics=["Writing unit tests", "Docker containerization", "Common interview questions"],
                    practice_project_idea="Containerize the app with Docker and write 5 pytest test cases",
                    recommended_resources=["Docker Docs", "Pytest Documentation"],
                ),
            ]
        else:  # 2_weeks or 1_month
            milestones = [
                RoadmapMilestoneSchema(
                    day_or_week="Week 1",
                    title="Foundation & Deep Conceptual Mastery",
                    target_skills=gap_skills[:2],
                    key_topics=["Design patterns", "Concurrency & Async I/O", "Data modeling"],
                    practice_project_idea="Develop core domain services and automated schemas",
                    recommended_resources=["Official Tech Documentation", "Refactoring Guru"],
                ),
                RoadmapMilestoneSchema(
                    day_or_week="Week 2",
                    title="Production-Grade Implementation & Interview Polish",
                    target_skills=gap_skills,
                    key_topics=["Security & Auth", "Caching & Performance", "System Architecture Mock Questions"],
                    practice_project_idea="Deploy fully tested microservice with CI/CD and README",
                    recommended_resources=["GitHub Actions Docs", "System Design Primer"],
                ),
            ]

        return LLMRoadmapOutput(
            target_role=target_role,
            readiness_impact=f"Bridging {len(gap_skills)} critical skill gaps will boost candidate match score by up to 35%.",
            milestones=milestones,
        )

    @classmethod
    async def list_roadmaps(cls, user_id: PydanticObjectId) -> List[SkillGapRoadmapResponse]:
        docs = await SkillGapRoadmapDocument.find(SkillGapRoadmapDocument.user_id == user_id).sort("-created_at").to_list()
        return [cls._to_roadmap_response(d) for d in docs]

    @classmethod
    async def get_roadmap_by_id(cls, user_id: PydanticObjectId, roadmap_id: PydanticObjectId) -> SkillGapRoadmapResponse:
        doc = await SkillGapRoadmapDocument.get(roadmap_id)
        if not doc or doc.user_id != user_id:
            raise ResourceNotFoundError("Roadmap", str(roadmap_id))
        return cls._to_roadmap_response(doc)

    @classmethod
    async def toggle_milestone_status(
        cls,
        user_id: PydanticObjectId,
        roadmap_id: PydanticObjectId,
        milestone_index: int,
    ) -> SkillGapRoadmapResponse:
        doc = await SkillGapRoadmapDocument.get(roadmap_id)
        if not doc or doc.user_id != user_id:
            raise ResourceNotFoundError("Roadmap", str(roadmap_id))
        
        if 0 <= milestone_index < len(doc.milestones):
            doc.milestones[milestone_index].completed = not doc.milestones[milestone_index].completed
            doc.updated_at = datetime.now(timezone.utc)
            await doc.save()

        return cls._to_roadmap_response(doc)

    @classmethod
    async def delete_roadmap(cls, user_id: PydanticObjectId, roadmap_id: PydanticObjectId) -> None:
        doc = await SkillGapRoadmapDocument.get(roadmap_id)
        if not doc or doc.user_id != user_id:
            raise ResourceNotFoundError("Roadmap", str(roadmap_id))
        await doc.delete()

    @staticmethod
    def _to_roadmap_response(doc: SkillGapRoadmapDocument) -> SkillGapRoadmapResponse:
        return SkillGapRoadmapResponse(
            id=str(doc.id),
            user_id=str(doc.user_id),
            job_id=str(doc.job_id) if doc.job_id else None,
            target_role=doc.target_role,
            duration_type=doc.duration_type,
            gap_skills=doc.gap_skills,
            milestones=[
                RoadmapMilestoneSchema(
                    day_or_week=m.day_or_week,
                    title=m.title,
                    target_skills=m.target_skills,
                    key_topics=m.key_topics,
                    practice_project_idea=m.practice_project_idea,
                    recommended_resources=m.recommended_resources,
                    completed=m.completed,
                )
                for m in doc.milestones
            ],
            readiness_impact=doc.readiness_impact,
            created_at=doc.created_at.isoformat(),
            updated_at=doc.updated_at.isoformat(),
        )
