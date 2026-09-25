import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from beanie import PydanticObjectId

from app.models.application import ApplicationDocument
from app.models.job import JobDocument
from app.models.matching import JobMatchDocument
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    PipelineStatsResponse,
)
from app.services.notification_service import notification_service
from app.schemas.notification import NotificationCreate

logger = logging.getLogger("app.applications")

VALID_STATUSES = [
    "SAVED",
    "APPLIED",
    "ASSESSMENT",
    "SHORTLISTED",
    "INTERVIEW",
    "OFFER",
    "REJECTED",
    "WITHDRAWN",
]


class ApplicationService:
    async def create_or_save_application(
        self,
        user_id: str,
        payload: ApplicationCreate,
    ) -> ApplicationDocument:
        """
        Creates or saves a job application with strict duplicate prevention on (user_id, job_id).
        """
        p_user_id = PydanticObjectId(user_id)
        p_job_id = PydanticObjectId(payload.job_id) if payload.job_id else None

        # 1. Duplicate check
        if p_job_id:
            existing = await ApplicationDocument.find_one(
                ApplicationDocument.user_id == p_user_id,
                ApplicationDocument.job_id == p_job_id,
            )
            if existing:
                raise ValueError(f"Application for job '{existing.job_title}' at '{existing.company_name}' already exists.")

        # 2. Enrich with Job metadata if job_id provided
        company = payload.company_name or "Target Company"
        title = payload.job_title or "Software Engineer"
        location = payload.location
        match_score = None

        if p_job_id:
            job = await JobDocument.get(p_job_id)
            if job:
                company = job.company
                title = job.title
                location = location or job.location

            match_doc = await JobMatchDocument.find_one(
                JobMatchDocument.user_id == p_user_id,
                JobMatchDocument.job_id == str(p_job_id),
            )
            if match_doc:
                match_score = match_doc.overall_score

        # Status validation
        status = payload.status.upper() if payload.status else "SAVED"
        if status not in VALID_STATUSES:
            status = "SAVED"

        applied_dt = None
        if payload.applied_date:
            try:
                applied_dt = datetime.fromisoformat(payload.applied_date.replace("Z", "+00:00"))
            except Exception:
                applied_dt = datetime.now(timezone.utc)
        elif status == "APPLIED":
            applied_dt = datetime.now(timezone.utc)

        interview_dt = None
        if payload.interview_date:
            try:
                interview_dt = datetime.fromisoformat(payload.interview_date.replace("Z", "+00:00"))
            except Exception:
                pass

        next_action_dt = None
        if payload.next_action_date:
            try:
                next_action_dt = datetime.fromisoformat(payload.next_action_date.replace("Z", "+00:00"))
            except Exception:
                pass

        app_doc = ApplicationDocument(
            user_id=p_user_id,
            job_id=p_job_id,
            company_name=company,
            job_title=title,
            status=status,
            applied_date=applied_dt,
            interview_date=interview_dt,
            next_action=payload.next_action,
            next_action_date=next_action_dt,
            notes=payload.notes,
            salary_offered=payload.salary_offered,
            location=location,
            match_score=match_score,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        await app_doc.insert()
        logger.info("Created application %s for user %s: %s at %s", app_doc.id, user_id, title, company)

        # Trigger notification
        await notification_service.create_notification(
            user_id=user_id,
            payload=NotificationCreate(
                title="Opportunity Tracked",
                message=f"Added {title} at {company} to your application pipeline ({status}).",
                type="STATUS_UPDATE",
                link_url=f"/applications",
            ),
        )

        return app_doc

    async def list_applications(
        self,
        user_id: str,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[ApplicationDocument]:
        """Lists applications with optional status and text search filtering."""
        p_user_id = PydanticObjectId(user_id)
        queries = [ApplicationDocument.user_id == p_user_id]

        if status and status.upper() in VALID_STATUSES:
            queries.append(ApplicationDocument.status == status.upper())

        docs = await ApplicationDocument.find(*queries).sort(-ApplicationDocument.updated_at).to_list()

        if search and search.strip():
            s = search.lower().strip()
            docs = [
                d for d in docs
                if s in d.company_name.lower() or s in d.job_title.lower() or (d.notes and s in d.notes.lower())
            ]

        return docs

    async def get_application_by_id(self, user_id: str, app_id: str) -> Optional[ApplicationDocument]:
        p_user_id = PydanticObjectId(user_id)
        p_app_id = PydanticObjectId(app_id)
        return await ApplicationDocument.find_one(
            ApplicationDocument.id == p_app_id,
            ApplicationDocument.user_id == p_user_id,
        )

    async def update_application(
        self,
        user_id: str,
        app_id: str,
        payload: ApplicationUpdate,
    ) -> ApplicationDocument:
        """Updates an application and triggers notifications on milestone status changes."""
        app_doc = await self.get_application_by_id(user_id=user_id, app_id=app_id)
        if not app_doc:
            raise ValueError("Application record not found.")

        old_status = app_doc.status

        if payload.status:
            new_status = payload.status.upper()
            if new_status in VALID_STATUSES:
                app_doc.status = new_status
                if new_status == "APPLIED" and not app_doc.applied_date:
                    app_doc.applied_date = datetime.now(timezone.utc)

        if payload.applied_date is not None:
            try:
                app_doc.applied_date = datetime.fromisoformat(payload.applied_date.replace("Z", "+00:00")) if payload.applied_date else None
            except Exception:
                pass

        if payload.interview_date is not None:
            try:
                app_doc.interview_date = datetime.fromisoformat(payload.interview_date.replace("Z", "+00:00")) if payload.interview_date else None
            except Exception:
                pass

        if payload.next_action_date is not None:
            try:
                app_doc.next_action_date = datetime.fromisoformat(payload.next_action_date.replace("Z", "+00:00")) if payload.next_action_date else None
            except Exception:
                pass

        if payload.next_action is not None:
            app_doc.next_action = payload.next_action
        if payload.notes is not None:
            app_doc.notes = payload.notes
        if payload.salary_offered is not None:
            app_doc.salary_offered = payload.salary_offered
        if payload.location is not None:
            app_doc.location = payload.location

        app_doc.update_timestamp()
        await app_doc.save()

        # Trigger notification if status changed to milestone
        if payload.status and payload.status.upper() != old_status:
            st = payload.status.upper()
            if st == "INTERVIEW":
                await notification_service.create_notification(
                    user_id=user_id,
                    payload=NotificationCreate(
                        title="Interview Scheduled 🎉",
                        message=f"You advanced to the INTERVIEW stage for {app_doc.job_title} at {app_doc.company_name}!",
                        type="INTERVIEW_REMINDER",
                        link_url=f"/interviews",
                    ),
                )
            elif st == "OFFER":
                await notification_service.create_notification(
                    user_id=user_id,
                    payload=NotificationCreate(
                        title="Job Offer Received! 🚀",
                        message=f"Congratulations! You received an OFFER for {app_doc.job_title} at {app_doc.company_name}.",
                        type="STATUS_UPDATE",
                        link_url=f"/applications",
                    ),
                )

        return app_doc

    async def delete_application(self, user_id: str, app_id: str) -> bool:
        app_doc = await self.get_application_by_id(user_id=user_id, app_id=app_id)
        if app_doc:
            await app_doc.delete()
            return True
        return False

    async def get_pipeline_stats(self, user_id: str) -> PipelineStatsResponse:
        """Computes pipeline status counts and conversion rates for a candidate."""
        p_user_id = PydanticObjectId(user_id)
        docs = await ApplicationDocument.find(ApplicationDocument.user_id == p_user_id).to_list()

        status_counts = {s: 0 for s in VALID_STATUSES}
        for d in docs:
            st = d.status if d.status in status_counts else "SAVED"
            status_counts[st] += 1

        total = len(docs)
        applied_total = total - status_counts["SAVED"]
        active = sum(status_counts[s] for s in ["APPLIED", "ASSESSMENT", "SHORTLISTED", "INTERVIEW"])
        interviews = status_counts["INTERVIEW"] + status_counts["OFFER"]
        offers = status_counts["OFFER"]

        interview_rate = round((interviews / applied_total * 100), 1) if applied_total > 0 else 0.0
        offer_rate = round((offers / interviews * 100), 1) if interviews > 0 else 0.0

        return PipelineStatsResponse(
            total_applications=total,
            active_pipeline=active,
            interviews_count=status_counts["INTERVIEW"],
            offers_count=offers,
            status_counts=status_counts,
            interview_conversion_rate=interview_rate,
            offer_conversion_rate=offer_rate,
        )


application_service = ApplicationService()
