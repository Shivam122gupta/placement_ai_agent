import io
import pytest
from httpx import AsyncClient
from beanie import PydanticObjectId
from docx import Document

from app.models.user import UserDocument
from app.models.profile import ProfileDocument
from app.models.application import ApplicationDocument
from app.models.interview import MockInterviewDocument, InterviewQuestionItem
from app.models.skill_gap import SkillGapRoadmapDocument, RoadmapMilestone
from app.models.notification import NotificationDocument
from app.core.security import get_password_hash, create_access_token


@pytest.fixture
async def two_users(mock_db):
    """Creates User A and User B with auth headers for cross-tenant IDOR testing."""
    user_a = UserDocument(
        email="user_a@test.com",
        hashed_password=get_password_hash("PasswordA123!"),
        is_active=True,
        is_verified=True,
    )
    await user_a.insert()
    profile_a = ProfileDocument(user_id=user_a.id, full_name="User Alpha", contact_email="user_a@test.com")
    await profile_a.insert()

    user_b = UserDocument(
        email="user_b@test.com",
        hashed_password=get_password_hash("PasswordB123!"),
        is_active=True,
        is_verified=True,
    )
    await user_b.insert()
    profile_b = ProfileDocument(user_id=user_b.id, full_name="User Beta", contact_email="user_b@test.com")
    await profile_b.insert()

    token_a = create_access_token(subject=str(user_a.id))
    token_b = create_access_token(subject=str(user_b.id))

    return {
        "user_a": user_a,
        "user_b": user_b,
        "headers_a": {"Authorization": f"Bearer {token_a}"},
        "headers_b": {"Authorization": f"Bearer {token_b}"},
    }


@pytest.mark.asyncio
async def test_application_idor_prevention(async_client: AsyncClient, two_users: dict):
    headers_a = two_users["headers_a"]
    headers_b = two_users["headers_b"]
    user_a = two_users["user_a"]

    # User A creates an application
    app_doc = ApplicationDocument(
        user_id=user_a.id,
        company_name="Google",
        job_title="Staff Software Engineer",
        status="APPLIED",
        notes="Secret candidate notes for Google",
    )
    await app_doc.insert()
    app_id = str(app_doc.id)

    # 1. User A can view their own application
    res_a = await async_client.get(f"/api/v1/applications/{app_id}", headers=headers_a)
    assert res_a.status_code == 200
    assert res_a.json()["company_name"] == "Google"

    # 2. User B tries to READ User A's application -> MUST be 404
    res_b_read = await async_client.get(f"/api/v1/applications/{app_id}", headers=headers_b)
    assert res_b_read.status_code == 404

    # 3. User B tries to MODIFY User A's application -> MUST be 404
    res_b_patch = await async_client.patch(
        f"/api/v1/applications/{app_id}",
        json={"notes": "Hacked notes by User B", "status": "REJECTED"},
        headers=headers_b,
    )
    assert res_b_patch.status_code == 404

    # Verify notes were not changed in database
    refreshed = await ApplicationDocument.get(app_doc.id)
    assert refreshed.notes == "Secret candidate notes for Google"
    assert refreshed.status == "APPLIED"

    # 4. User B tries to DELETE User A's application -> MUST be 404
    res_b_delete = await async_client.delete(f"/api/v1/applications/{app_id}", headers=headers_b)
    assert res_b_delete.status_code == 404

    # Verify application was not deleted
    still_exists = await ApplicationDocument.get(app_doc.id)
    assert still_exists is not None

    # 5. User A can successfully delete their own application
    res_a_del = await async_client.delete(f"/api/v1/applications/{app_id}", headers=headers_a)
    assert res_a_del.status_code == 200
    deleted_check = await ApplicationDocument.get(app_doc.id)
    assert deleted_check is None


@pytest.mark.asyncio
async def test_interview_idor_prevention(async_client: AsyncClient, two_users: dict):
    headers_a = two_users["headers_a"]
    headers_b = two_users["headers_b"]
    user_a = two_users["user_a"]

    # User A has a mock interview session
    interview = MockInterviewDocument(
        user_id=user_a.id,
        title="Mock Interview: System Architect",
        target_role="System Architect",
        questions=[
            InterviewQuestionItem(
                order_num=1,
                category="TECHNICAL",
                difficulty="HARD",
                question="Explain Raft consensus algorithm.",
                expected_concepts=["Leader Election", "Log Replication"],
            )
        ],
    )
    await interview.insert()
    interview_id = str(interview.id)
    q_id = interview.questions[0].question_id

    # 1. User A can view their interview
    res_a = await async_client.get(f"/api/v1/interviews/{interview_id}", headers=headers_a)
    assert res_a.status_code == 200

    # 2. User B tries to READ User A's interview -> MUST be 404
    res_b = await async_client.get(f"/api/v1/interviews/{interview_id}", headers=headers_b)
    assert res_b.status_code == 404

    # 3. User B tries to SUBMIT an answer for User A's interview -> MUST be 400 or 404
    res_b_ans = await async_client.post(
        f"/api/v1/interviews/{interview_id}/answers",
        json={"question_id": q_id, "candidate_answer": "Malicious answer attempt."},
        headers=headers_b,
    )
    assert res_b_ans.status_code in [400, 404]

    # Verify answer was not saved
    fresh_interview = await MockInterviewDocument.get(interview.id)
    assert fresh_interview.questions[0].candidate_answer is None

    # 4. User B tries to COMPLETE User A's interview -> MUST be 404
    res_b_complete = await async_client.post(f"/api/v1/interviews/{interview_id}/complete", headers=headers_b)
    assert res_b_complete.status_code == 404

    # 5. User B tries to DELETE User A's interview -> MUST be 404
    res_b_del = await async_client.delete(f"/api/v1/interviews/{interview_id}", headers=headers_b)
    assert res_b_del.status_code == 404

    # Verify interview still exists
    assert await MockInterviewDocument.get(interview.id) is not None


@pytest.mark.asyncio
async def test_roadmap_idor_prevention(async_client: AsyncClient, two_users: dict):
    headers_a = two_users["headers_a"]
    headers_b = two_users["headers_b"]
    user_a = two_users["user_a"]

    # User A creates a learning roadmap
    roadmap = SkillGapRoadmapDocument(
        user_id=user_a.id,
        target_role="Cloud Architect",
        duration_type="2_weeks",
        gap_skills=["Kubernetes", "Terraform"],
        milestones=[
            RoadmapMilestone(
                day_or_week="Week 1",
                title="Kubernetes Core Architecture",
                target_skills=["Kubernetes"],
                completed=False,
            )
        ],
    )
    await roadmap.insert()
    roadmap_id = str(roadmap.id)

    # 1. User A can view their roadmap
    res_a = await async_client.get(f"/api/v1/skill-gaps/{roadmap_id}", headers=headers_a)
    assert res_a.status_code == 200

    # 2. User B tries to READ User A's roadmap -> MUST be 404
    res_b_read = await async_client.get(f"/api/v1/skill-gaps/{roadmap_id}", headers=headers_b)
    assert res_b_read.status_code == 404

    # 3. User B tries to TOGGLE milestone status -> MUST be 404
    res_b_toggle = await async_client.patch(
        f"/api/v1/skill-gaps/{roadmap_id}/milestones/0/toggle",
        headers=headers_b,
    )
    assert res_b_toggle.status_code == 404

    # Verify milestone completion did not change
    fresh_doc = await SkillGapRoadmapDocument.get(roadmap.id)
    assert fresh_doc.milestones[0].completed is False

    # 4. User B tries to DELETE User A's roadmap -> MUST be 404
    res_b_del = await async_client.delete(f"/api/v1/skill-gaps/{roadmap_id}", headers=headers_b)
    assert res_b_del.status_code == 404
    assert await SkillGapRoadmapDocument.get(roadmap.id) is not None


@pytest.mark.asyncio
async def test_notification_idor_prevention(async_client: AsyncClient, two_users: dict):
    headers_a = two_users["headers_a"]
    headers_b = two_users["headers_b"]
    user_a = two_users["user_a"]

    notif = NotificationDocument(
        user_id=user_a.id,
        title="Exclusive Interview Invitation",
        message="Confidential interview details for User A",
        is_read=False,
    )
    await notif.insert()
    notif_id = str(notif.id)

    # 1. User B tries to mark User A's notification as read -> MUST be 404
    res_b_read = await async_client.patch(f"/api/v1/notifications/{notif_id}/read", headers=headers_b)
    assert res_b_read.status_code == 404

    # Verify notification remains unread
    fresh_notif = await NotificationDocument.get(notif.id)
    assert fresh_notif.is_read is False

    # 2. User A marks it as read -> 200
    res_a_read = await async_client.patch(f"/api/v1/notifications/{notif_id}/read", headers=headers_a)
    assert res_a_read.status_code == 200
    assert res_a_read.json()["is_read"] is True


@pytest.mark.asyncio
async def test_resume_idor_prevention(async_client: AsyncClient, two_users: dict):
    headers_a = two_users["headers_a"]
    headers_b = two_users["headers_b"]

    # User A uploads a resume
    doc = Document()
    doc.add_heading("User A Confidential Resume", level=1)
    doc.add_paragraph("Top Secret Projects and proprietary credentials.")
    file_stream = io.BytesIO()
    doc.save(file_stream)
    file_stream.seek(0)

    upload_res = await async_client.post(
        "/api/v1/resumes",
        files={"file": ("user_a_resume.docx", file_stream, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        headers=headers_a,
    )
    assert upload_res.status_code == 201
    resume_id = upload_res.json()["data"]["id"]

    # 1. User A can view and download their resume
    res_a_view = await async_client.get(f"/api/v1/resumes/{resume_id}", headers=headers_a)
    assert res_a_view.status_code == 200

    # 2. User B tries to READ User A's resume -> MUST be 404
    res_b_view = await async_client.get(f"/api/v1/resumes/{resume_id}", headers=headers_b)
    assert res_b_view.status_code == 404

    # 3. User B tries to DOWNLOAD User A's raw resume file -> MUST be 404
    res_b_down = await async_client.get(f"/api/v1/resumes/{resume_id}/download", headers=headers_b)
    assert res_b_down.status_code == 404

    # 4. User B tries to SYNC User A's resume to profile -> MUST be 404
    res_b_sync = await async_client.post(
        f"/api/v1/resumes/{resume_id}/sync-profile",
        json={"sync_skills": True},
        headers=headers_b,
    )
    assert res_b_sync.status_code == 404

    # 5. User B tries to DELETE User A's resume -> MUST be 404
    res_b_del = await async_client.delete(f"/api/v1/resumes/{resume_id}", headers=headers_b)
    assert res_b_del.status_code == 404

    # 6. User A deletes their own resume -> MUST be 200
    res_a_del = await async_client.delete(f"/api/v1/resumes/{resume_id}", headers=headers_a)
    assert res_a_del.status_code == 200


@pytest.mark.asyncio
async def test_invalid_object_ids_graceful_handling(async_client: AsyncClient, two_users: dict):
    """Verifies that malformed IDs in URLs return clean 400 or 404 without crashing with 500."""
    headers_a = two_users["headers_a"]
    bad_id = "invalid-not-an-object-id-123"

    res_app = await async_client.get(f"/api/v1/applications/{bad_id}", headers=headers_a)
    assert res_app.status_code == 404

    res_interview = await async_client.get(f"/api/v1/interviews/{bad_id}", headers=headers_a)
    assert res_interview.status_code == 404

    res_notif = await async_client.patch(f"/api/v1/notifications/{bad_id}/read", headers=headers_a)
    assert res_notif.status_code == 404

    res_resume = await async_client.get(f"/api/v1/resumes/{bad_id}", headers=headers_a)
    assert res_resume.status_code == 400

    res_job = await async_client.get(f"/api/v1/jobs/{bad_id}", headers=headers_a)
    assert res_job.status_code == 400
