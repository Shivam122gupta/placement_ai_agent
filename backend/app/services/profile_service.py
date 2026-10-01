import uuid
import logging
from typing import Any
from beanie import PydanticObjectId
from app.core.exceptions import ResourceNotFoundError
from app.models.user import UserDocument
from app.models.profile import (
    ProfileDocument,
    EducationItem,
    ExperienceItem,
    SkillItem,
    ProjectItem,
    CertificationItem,
)
from app.schemas.profile import (
    ProfileUpdateRequest,
    EducationCreateRequest,
    ExperienceCreateRequest,
    SkillCreateRequest,
    ProjectCreateRequest,
    CertificationCreateRequest,
    ProfileResponse,
)
from app.schemas.resume import ParsedResumeSchema

logger = logging.getLogger("app.services.profile")


class ProfileService:
    @staticmethod
    def calculate_completion_score(profile: ProfileDocument) -> int:
        score = 0
        
        # 1. Personal & Contact info & Preferences (20 points)
        if profile.full_name and len(profile.full_name.strip()) > 0:
            score += 5
        if profile.contact_email or profile.phone:
            score += 5
        if (profile.target_roles and len(profile.target_roles) > 0) or profile.location:
            score += 5
        if (profile.preferred_locations and len(profile.preferred_locations) > 0) or profile.headline or profile.bio:
            score += 5

        # 2. Education (20 points)
        if profile.education and len(profile.education) > 0:
            score += 20

        # 3. Skills (25 points) - At least 3 skills for full score
        skills_count = len(profile.skills) if profile.skills else 0
        if skills_count >= 3:
            score += 25
        elif skills_count > 0:
            score += skills_count * 8

        # 4. Projects (25 points) - At least 1 project with details
        if profile.projects and len(profile.projects) > 0:
            score += 25

        # 5. Certifications / Work Experience / Extra links (10 points)
        if (
            (profile.certifications and len(profile.certifications) > 0)
            or (profile.experience and len(profile.experience) > 0)
            or profile.linkedin_url
            or profile.github_url
        ):
            score += 10

        return min(score, 100)

    @classmethod
    def to_profile_response(cls, profile: ProfileDocument) -> ProfileResponse:
        return ProfileResponse(
            id=str(profile.id),
            user_id=str(profile.user_id),
            full_name=profile.full_name,
            headline=profile.headline,
            bio=profile.bio,
            contact_email=profile.contact_email,
            phone=profile.phone,
            location=profile.location,
            linkedin_url=profile.linkedin_url,
            github_url=profile.github_url,
            portfolio_url=profile.portfolio_url,
            target_roles=profile.target_roles,
            preferred_locations=profile.preferred_locations,
            experience_level=profile.experience_level,
            work_preference=profile.work_preference,
            employment_type=profile.employment_type,
            education=profile.education,
            experience=profile.experience,
            skills=profile.skills,
            projects=profile.projects,
            certifications=profile.certifications,
            completion_score=profile.completion_score,
            created_at=profile.created_at.isoformat(),
            updated_at=profile.updated_at.isoformat(),
        )

    @classmethod
    async def get_profile(cls, user_id: Any) -> ProfileResponse:
        """Alias for get_by_user_id with automatic ObjectId casting."""
        return await cls.get_by_user_id(user_id=user_id)

    @classmethod
    async def get_by_user_id(cls, user_id: Any) -> ProfileResponse:
        uid = PydanticObjectId(str(user_id)) if not isinstance(user_id, PydanticObjectId) else user_id
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == uid)
        if not profile:
            # Auto-create if not present
            user = await UserDocument.get(uid)
            contact_email = user.email if user else None
            profile = ProfileDocument(
                user_id=uid,
                full_name="",
                contact_email=contact_email,
            )
            profile.completion_score = cls.calculate_completion_score(profile)
            await profile.insert()
        return cls.to_profile_response(profile)

    @classmethod
    async def update_profile(cls, user_id: PydanticObjectId, req: ProfileUpdateRequest) -> ProfileResponse:
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == user_id)
        if not profile:
            profile = ProfileDocument(user_id=user_id)
            await profile.insert()

        update_data = req.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                setattr(profile, key, value)

        profile.completion_score = cls.calculate_completion_score(profile)
        profile.update_timestamp()
        await profile.save()
        return cls.to_profile_response(profile)

    @classmethod
    async def sync_full_from_parsed_resume(
        cls, user_id: PydanticObjectId, parsed: ParsedResumeSchema
    ) -> ProfileResponse:
        """
        Auto-populates candidate profile from a freshly parsed resume.
        Fills Name, Location, Bio, Headline, Education, Experience, Projects, Skills, and Certifications.
        """
        logger.info(f"Auto-syncing full profile from parsed resume for user {user_id}")
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == user_id)
        if not profile:
            profile = ProfileDocument(user_id=user_id)
            await profile.insert()

        # 1. Update Personal & Contact Info
        if parsed.full_name and len(parsed.full_name.strip()) > 0:
            profile.full_name = parsed.full_name.strip()

        if parsed.contact_email:
            profile.contact_email = parsed.contact_email
        if parsed.phone:
            profile.phone = parsed.phone
        if parsed.location:
            profile.location = parsed.location
        if parsed.summary:
            profile.bio = parsed.summary
        if parsed.headline:
            profile.headline = parsed.headline
        elif parsed.skills and not profile.headline:
            top_skills = [s.name for s in parsed.skills[:3]]
            profile.headline = f"Software Engineer | {', '.join(top_skills)}"

        if parsed.linkedin_url:
            profile.linkedin_url = parsed.linkedin_url
        if parsed.github_url:
            profile.github_url = parsed.github_url
        if parsed.portfolio_url:
            profile.portfolio_url = parsed.portfolio_url

        # 2. Merge Education
        if parsed.education:
            existing_edu_degrees = {e.degree.lower().strip() for e in profile.education}
            for edu in parsed.education:
                if edu.degree.lower().strip() not in existing_edu_degrees:
                    profile.education.append(
                        EducationItem(
                            degree=edu.degree,
                            college=edu.college,
                            branch=edu.branch,
                            graduation_year=edu.graduation_year,
                            cgpa=edu.cgpa,
                        )
                    )
                    existing_edu_degrees.add(edu.degree.lower().strip())

        # 3. Merge Experience
        if parsed.experience:
            existing_exp = {(e.company.lower().strip(), e.role.lower().strip()) for e in profile.experience}
            for exp in parsed.experience:
                key = (exp.company.lower().strip(), exp.role.lower().strip())
                if key not in existing_exp:
                    profile.experience.append(
                        ExperienceItem(
                            company=exp.company,
                            role=exp.role,
                            duration=exp.duration,
                            location=exp.location,
                            highlights=exp.highlights,
                        )
                    )
                    existing_exp.add(key)

        # 4. Merge Skills
        if parsed.skills:
            existing_skill_names = {s.name.lower().strip() for s in profile.skills}
            for s in parsed.skills:
                if s.name.lower().strip() not in existing_skill_names:
                    profile.skills.append(
                        SkillItem(
                            name=s.name,
                            category=s.category or "General",
                            proficiency=s.proficiency or "Intermediate",
                        )
                    )
                    existing_skill_names.add(s.name.lower().strip())

        # 5. Merge Projects
        if parsed.projects:
            existing_proj_names = {p.name.lower().strip() for p in profile.projects}
            for proj in parsed.projects:
                if proj.name.lower().strip() not in existing_proj_names:
                    profile.projects.append(
                        ProjectItem(
                            name=proj.name,
                            description=proj.description,
                            technologies=proj.technologies,
                            github_url=proj.github_url,
                            live_url=proj.live_url,
                            role=proj.role or "Developer",
                        )
                    )
                    existing_proj_names.add(proj.name.lower().strip())

        # 6. Merge Certifications
        if parsed.certifications:
            existing_cert_names = {c.name.lower().strip() for c in profile.certifications}
            for cert in parsed.certifications:
                if cert.name.lower().strip() not in existing_cert_names:
                    profile.certifications.append(
                        CertificationItem(
                            name=cert.name,
                            issuer=cert.issuer,
                            issue_date=cert.issue_date,
                            credential_url=cert.credential_url,
                        )
                    )
                    existing_cert_names.add(cert.name.lower().strip())

        # Auto-infer target roles if empty
        if not profile.target_roles and parsed.skills:
            skill_names = [s.name.lower() for s in parsed.skills]
            inferred = []
            if any(k in skill_names for k in ["python", "fastapi", "django", "flask", "node", "java", "golang"]):
                inferred.append("Backend Developer")
            if any(k in skill_names for k in ["react", "vue", "angular", "next.js", "typescript", "tailwind"]):
                inferred.append("Frontend Developer")
            if any(k in skill_names for k in ["pytorch", "tensorflow", "machine learning", "rag", "llm", "deep learning"]):
                inferred.append("AI / ML Engineer")
            if not inferred:
                inferred = ["Software Engineer"]
            profile.target_roles = inferred

        profile.completion_score = cls.calculate_completion_score(profile)
        profile.update_timestamp()
        await profile.save()
        logger.info(f"Profile auto-built successfully for {user_id}. Completion score: {profile.completion_score}%")
        return cls.to_profile_response(profile)

    # ------------------- Nested Array Operations -------------------

    @classmethod
    async def add_education(cls, user_id: PydanticObjectId, req: EducationCreateRequest) -> ProfileResponse:
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == user_id)
        if not profile:
            raise ResourceNotFoundError("Profile")

        item = EducationItem(
            id=str(uuid.uuid4()),
            degree=req.degree,
            college=req.college,
            branch=req.branch,
            graduation_year=req.graduation_year,
            cgpa=req.cgpa,
        )
        profile.education.append(item)
        profile.completion_score = cls.calculate_completion_score(profile)
        profile.update_timestamp()
        await profile.save()
        return cls.to_profile_response(profile)

    @classmethod
    async def delete_education(cls, user_id: PydanticObjectId, item_id: str) -> ProfileResponse:
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == user_id)
        if not profile:
            raise ResourceNotFoundError("Profile")

        profile.education = [e for e in profile.education if e.id != item_id]
        profile.completion_score = cls.calculate_completion_score(profile)
        profile.update_timestamp()
        await profile.save()
        return cls.to_profile_response(profile)

    @classmethod
    async def add_experience(cls, user_id: PydanticObjectId, req: ExperienceCreateRequest) -> ProfileResponse:
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == user_id)
        if not profile:
            raise ResourceNotFoundError("Profile")

        item = ExperienceItem(
            id=str(uuid.uuid4()),
            company=req.company,
            role=req.role,
            duration=req.duration,
            location=req.location,
            highlights=req.highlights,
        )
        profile.experience.append(item)
        profile.completion_score = cls.calculate_completion_score(profile)
        profile.update_timestamp()
        await profile.save()
        return cls.to_profile_response(profile)

    @classmethod
    async def delete_experience(cls, user_id: PydanticObjectId, item_id: str) -> ProfileResponse:
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == user_id)
        if not profile:
            raise ResourceNotFoundError("Profile")

        profile.experience = [e for e in profile.experience if e.id != item_id]
        profile.completion_score = cls.calculate_completion_score(profile)
        profile.update_timestamp()
        await profile.save()
        return cls.to_profile_response(profile)

    @classmethod
    async def add_skill(cls, user_id: PydanticObjectId, req: SkillCreateRequest) -> ProfileResponse:
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == user_id)
        if not profile:
            raise ResourceNotFoundError("Profile")

        # Deduplicate skill by name
        existing = any(s.name.lower() == req.name.strip().lower() for s in profile.skills)
        if not existing:
            item = SkillItem(
                id=str(uuid.uuid4()),
                name=req.name.strip(),
                category=req.category or "General",
                proficiency=req.proficiency or "Intermediate",
            )
            profile.skills.append(item)
            profile.completion_score = cls.calculate_completion_score(profile)
            profile.update_timestamp()
            await profile.save()

        return cls.to_profile_response(profile)

    @classmethod
    async def delete_skill(cls, user_id: PydanticObjectId, item_id: str) -> ProfileResponse:
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == user_id)
        if not profile:
            raise ResourceNotFoundError("Profile")

        profile.skills = [s for s in profile.skills if s.id != item_id]
        profile.completion_score = cls.calculate_completion_score(profile)
        profile.update_timestamp()
        await profile.save()
        return cls.to_profile_response(profile)

    @classmethod
    async def add_project(cls, user_id: PydanticObjectId, req: ProjectCreateRequest) -> ProfileResponse:
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == user_id)
        if not profile:
            raise ResourceNotFoundError("Profile")

        item = ProjectItem(
            id=str(uuid.uuid4()),
            name=req.name,
            description=req.description,
            technologies=req.technologies,
            github_url=req.github_url,
            live_url=req.live_url,
            role=req.role or "Developer",
        )
        profile.projects.append(item)
        profile.completion_score = cls.calculate_completion_score(profile)
        profile.update_timestamp()
        await profile.save()
        return cls.to_profile_response(profile)

    @classmethod
    async def delete_project(cls, user_id: PydanticObjectId, item_id: str) -> ProfileResponse:
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == user_id)
        if not profile:
            raise ResourceNotFoundError("Profile")

        profile.projects = [p for p in profile.projects if p.id != item_id]
        profile.completion_score = cls.calculate_completion_score(profile)
        profile.update_timestamp()
        await profile.save()
        return cls.to_profile_response(profile)

    @classmethod
    async def add_certification(cls, user_id: PydanticObjectId, req: CertificationCreateRequest) -> ProfileResponse:
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == user_id)
        if not profile:
            raise ResourceNotFoundError("Profile")

        item = CertificationItem(
            id=str(uuid.uuid4()),
            name=req.name,
            issuer=req.issuer,
            issue_date=req.issue_date,
            credential_url=req.credential_url,
        )
        profile.certifications.append(item)
        profile.completion_score = cls.calculate_completion_score(profile)
        profile.update_timestamp()
        await profile.save()
        return cls.to_profile_response(profile)

    @classmethod
    async def delete_certification(cls, user_id: PydanticObjectId, item_id: str) -> ProfileResponse:
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == user_id)
        if not profile:
            raise ResourceNotFoundError("Profile")

        profile.certifications = [c for c in profile.certifications if c.id != item_id]
        profile.completion_score = cls.calculate_completion_score(profile)
        profile.update_timestamp()
        await profile.save()
        return cls.to_profile_response(profile)
