import logging
from typing import List, Optional, Tuple
from fastapi import UploadFile
from beanie import PydanticObjectId

from app.models.resume import ResumeDocument, ResumeVersionDocument
from app.models.profile import ProfileDocument, EducationItem, SkillItem, ProjectItem, CertificationItem
from app.schemas.resume import (
    ParsedResumeSchema,
    ResumeResponse,
    ResumeVersionResponse,
    ProfileSyncRequest,
)
from app.schemas.profile import ProfileResponse
from app.services.storage_service import StorageService
from app.services.parsers import extract_document_text
from app.services.profile_service import ProfileService
from app.providers.llm import get_llm_provider
from app.core.exceptions import ResourceNotFoundError, PermissionDeniedError, AppException

logger = logging.getLogger("app.services.resume")


class ResumeService:
    @classmethod
    async def upload_and_parse(cls, user_id: PydanticObjectId, file: UploadFile) -> ResumeResponse:
        # 1. Save file to secure private storage
        rel_path, orig_filename, file_size, checksum = await StorageService.save_resume_file(
            user_id=str(user_id),
            file=file,
        )

        # 2. Create Resume Document
        resume_doc = ResumeDocument(
            user_id=user_id,
            filename=orig_filename,
            file_path=rel_path,
            file_size=file_size,
            mime_type=file.content_type or "application/pdf",
            status="PROCESSING",
            checksum=checksum,
        )
        await resume_doc.insert()

        try:
            # 3. Extract text from document
            abs_path = StorageService.get_absolute_path(rel_path)
            raw_text = extract_document_text(abs_path)

            if not raw_text or len(raw_text.strip()) < 20:
                raise AppException(
                    status_code=422,
                    code="EMPTY_DOCUMENT_TEXT",
                    message="Document did not contain readable text. Please ensure it is not a scanned image.",
                )

            # 4. Extract structured data via LLM
            llm = get_llm_provider()
            prompt = (
                f"Extract structured candidate information from this resume document:\n\n"
                f"--- BEGIN RESUME TEXT ---\n{raw_text}\n--- END RESUME TEXT ---"
            )
            system_prompt = (
                "You are an expert AI Resume Parser. Extract facts accurately into the JSON schema. "
                "Never invent or hallucinate missing information."
            )

            parsed_data = await llm.generate_structured_output(
                schema=ParsedResumeSchema,
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.0,
            )

            # 5. Save version record
            version_doc = ResumeVersionDocument(
                resume_id=resume_doc.id,
                user_id=user_id,
                version_number=1,
                parsed_data=parsed_data,
                raw_text=raw_text,
            )
            await version_doc.insert()

            resume_doc.status = "COMPLETED"
            resume_doc.update_timestamp()
            await resume_doc.save()

            # 6. Auto-Build and Populate Candidate Profile immediately (Zero Manual Typing)
            try:
                await ProfileService.sync_full_from_parsed_resume(user_id=user_id, parsed=parsed_data)
                logger.info(f"Auto-populated candidate profile for user {user_id} from resume {resume_doc.id}")
            except Exception as sync_err:
                logger.warning(f"Auto-profile population warning for user {user_id}: {sync_err}")

            # 7. Auto-Ingest into Qdrant Vector Semantic Memory for RAG & Copilot
            try:
                from app.services.memory_service import MemoryService
                await MemoryService.sync_resume_to_memory(user_id=user_id, resume_id=resume_doc.id, parsed_data=parsed_data)
                logger.info(f"Auto-synced semantic vector memory for user {user_id}")
            except Exception as mem_err:
                logger.warning(f"Auto-vector memory sync warning for user {user_id}: {mem_err}")

            return cls._to_resume_response(resume_doc, parsed_data)

        except Exception as e:
            logger.error(f"Resume parsing failed for resume {resume_doc.id}: {e}", exc_info=True)
            resume_doc.status = "FAILED"
            resume_doc.error_message = str(e)
            resume_doc.update_timestamp()
            await resume_doc.save()
            raise

    @classmethod
    async def get_user_resumes(cls, user_id: PydanticObjectId) -> List[ResumeResponse]:
        resumes = await ResumeDocument.find(
            ResumeDocument.user_id == user_id
        ).sort("-created_at").to_list()

        if not resumes:
            return []

        resume_ids = [r.id for r in resumes]
        all_versions = await ResumeVersionDocument.find(
            {"resume_id": {"$in": resume_ids}}
        ).sort("-version_number").to_list()

        latest_versions: dict = {}
        for v in all_versions:
            if v.resume_id not in latest_versions:
                latest_versions[v.resume_id] = v

        results = []
        for r in resumes:
            latest_version = latest_versions.get(r.id)
            parsed = latest_version.parsed_data if latest_version else None
            results.append(cls._to_resume_response(r, parsed))
        return results

    @classmethod
    async def get_resume_by_id(cls, user_id: PydanticObjectId, resume_id: PydanticObjectId) -> ResumeResponse:
        resume = await ResumeDocument.get(resume_id)
        if not resume:
            raise ResourceNotFoundError("Resume", str(resume_id))

        if resume.user_id != user_id:
            raise PermissionDeniedError("You do not have access to this resume.")

        latest_version = await ResumeVersionDocument.find_one(
            ResumeVersionDocument.resume_id == resume.id,
            sort=[("version_number", -1)],
        )
        parsed = latest_version.parsed_data if latest_version else None
        return cls._to_resume_response(resume, parsed)

    @classmethod
    async def get_raw_file_for_download(cls, user_id: PydanticObjectId, resume_id: PydanticObjectId) -> Tuple[bytes, str, str]:
        resume = await ResumeDocument.get(resume_id)
        if not resume:
            raise ResourceNotFoundError("Resume", str(resume_id))

        if resume.user_id != user_id:
            raise PermissionDeniedError("You do not have access to this resume.")

        data = StorageService.read_file_bytes(resume.file_path)
        return data, resume.filename, resume.mime_type

    @classmethod
    async def sync_to_profile(
        cls, user_id: PydanticObjectId, resume_id: PydanticObjectId, sync_req: ProfileSyncRequest
    ) -> ProfileResponse:
        resume = await ResumeDocument.get(resume_id)
        if not resume or resume.user_id != user_id:
            raise ResourceNotFoundError("Resume", str(resume_id))

        latest_version = await ResumeVersionDocument.find_one(
            ResumeVersionDocument.resume_id == resume.id,
            sort=[("version_number", -1)],
        )
        if not latest_version or not latest_version.parsed_data:
            raise AppException(status_code=400, code="NO_PARSED_DATA", message="Resume has no parsed data to sync.")

        parsed = latest_version.parsed_data
        profile = await ProfileDocument.find_one(ProfileDocument.user_id == user_id)
        if not profile:
            profile = ProfileDocument(user_id=user_id)
            await profile.insert()

        # 1. Sync Personal Info
        if sync_req.sync_personal:
            if parsed.full_name:
                profile.full_name = parsed.full_name
            if parsed.contact_email and not profile.contact_email:
                profile.contact_email = parsed.contact_email
            if parsed.location and not profile.location:
                profile.location = parsed.location
            if parsed.phone and not profile.phone:
                profile.phone = parsed.phone
            if parsed.headline:
                profile.headline = parsed.headline
            if parsed.summary:
                profile.bio = parsed.summary
            if parsed.linkedin_url:
                profile.linkedin_url = parsed.linkedin_url
            if parsed.github_url:
                profile.github_url = parsed.github_url

        # 2. Sync Skills (Deduplicated)
        if sync_req.sync_skills and parsed.skills:
            existing_skill_names = {s.name.lower() for s in profile.skills}
            for s in parsed.skills:
                if s.name.lower() not in existing_skill_names:
                    profile.skills.append(
                        SkillItem(
                            name=s.name,
                            category=s.category or "General",
                            proficiency=s.proficiency or "Intermediate",
                        )
                    )
                    existing_skill_names.add(s.name.lower())

        # 3. Sync Education
        if sync_req.sync_education and parsed.education:
            existing_edu_degrees = {e.degree.lower() for e in profile.education}
            for edu in parsed.education:
                if edu.degree.lower() not in existing_edu_degrees:
                    profile.education.append(
                        EducationItem(
                            degree=edu.degree,
                            college=edu.college,
                            branch=edu.branch,
                            graduation_year=edu.graduation_year,
                            cgpa=edu.cgpa,
                        )
                    )
                    existing_edu_degrees.add(edu.degree.lower())

        # 4. Sync Experience
        if sync_req.sync_experience and parsed.experience:
            from app.models.profile import ExperienceItem
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

        # 5. Sync Projects
        if sync_req.sync_projects and parsed.projects:
            existing_proj_names = {p.name.lower() for p in profile.projects}
            for proj in parsed.projects:
                if proj.name.lower() not in existing_proj_names:
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
                    existing_proj_names.add(proj.name.lower())

        # 6. Sync Certifications
        if sync_req.sync_certifications and parsed.certifications:
            existing_cert_names = {c.name.lower() for c in profile.certifications}
            for cert in parsed.certifications:
                if cert.name.lower() not in existing_cert_names:
                    profile.certifications.append(
                        CertificationItem(
                            name=cert.name,
                            issuer=cert.issuer,
                            issue_date=cert.issue_date,
                            credential_url=cert.credential_url,
                        )
                    )
                    existing_cert_names.add(cert.name.lower())

        profile.completion_score = ProfileService.calculate_completion_score(profile)
        profile.update_timestamp()
        await profile.save()
        return ProfileService.to_profile_response(profile)

    @classmethod
    async def delete_resume(cls, user_id: PydanticObjectId, resume_id: PydanticObjectId) -> bool:
        resume = await ResumeDocument.get(resume_id)
        if not resume:
            raise ResourceNotFoundError("Resume", str(resume_id))

        if resume.user_id != user_id:
            raise PermissionDeniedError("You do not have access to delete this resume.")

        # Delete physical file
        StorageService.delete_file(resume.file_path)

        # Delete database versions and resume record
        await ResumeVersionDocument.find(ResumeVersionDocument.resume_id == resume.id).delete()
        await resume.delete()
        return True

    @staticmethod
    def _to_resume_response(resume: ResumeDocument, parsed_data: Optional[ParsedResumeSchema] = None) -> ResumeResponse:
        return ResumeResponse(
            id=str(resume.id),
            user_id=str(resume.user_id),
            filename=resume.filename,
            file_size=resume.file_size,
            mime_type=resume.mime_type,
            status=resume.status,
            checksum=resume.checksum,
            parsed_data=parsed_data,
            created_at=resume.created_at.isoformat(),
            updated_at=resume.updated_at.isoformat(),
        )
