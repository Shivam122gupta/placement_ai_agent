import uuid
from typing import List, Optional
from beanie import PydanticObjectId
from app.core.exceptions import ResourceNotFoundError
from app.models.profile import (
    ProfileDocument,
    EducationItem,
    SkillItem,
    ProjectItem,
    CertificationItem,
)
from app.schemas.profile import (
    ProfileUpdateRequest,
    EducationCreateRequest,
    SkillCreateRequest,
    ProjectCreateRequest,
    CertificationCreateRequest,
    ProfileResponse,
)


class ProfileService:
    @staticmethod
    def calculate_completion_score(profile: ProfileDocument) -> int:
        score = 0
        
        # 1. Personal & Contact info (20 points)
        if profile.full_name and len(profile.full_name.strip()) > 0:
            score += 5
        if profile.contact_email:
            score += 5
        if profile.target_roles and len(profile.target_roles) > 0:
            score += 5
        if profile.preferred_locations and len(profile.preferred_locations) > 0:
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

        # 5. Certifications & Extra links (10 points)
        if profile.certifications and len(profile.certifications) > 0:
            score += 10

        return min(score, 100)

    @classmethod
    def to_profile_response(cls, profile: ProfileDocument) -> ProfileResponse:
        return ProfileResponse(
            id=str(profile.id),
            user_id=str(profile.user_id),
            full_name=profile.full_name,
            contact_email=profile.contact_email,
            phone=profile.phone,
            location=profile.location,
            target_roles=profile.target_roles,
            preferred_locations=profile.preferred_locations,
            experience_level=profile.experience_level,
            work_preference=profile.work_preference,
            employment_type=profile.employment_type,
            education=profile.education,
            skills=profile.skills,
            projects=profile.projects,
            certifications=profile.certifications,
            completion_score=profile.completion_score,
            created_at=profile.created_at.isoformat(),
            updated_at=profile.updated_at.isoformat(),
        )

    @classmethod
    async def get_by_user_id(cls, user_id: PydanticObjectId) -> ProfileResponse:
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == user_id)
        if not profile:
            # Auto-create if not present
            profile = ProfileDocument(user_id=user_id)
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
