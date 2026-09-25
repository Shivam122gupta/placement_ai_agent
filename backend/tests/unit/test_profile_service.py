import pytest
from beanie import PydanticObjectId
from app.models.profile import ProfileDocument, EducationItem, SkillItem, ProjectItem, CertificationItem
from app.services.profile_service import ProfileService


def test_completion_score_empty_profile():
    profile = ProfileDocument(user_id=PydanticObjectId())
    score = ProfileService.calculate_completion_score(profile)
    assert score == 0


def test_completion_score_full_profile():
    profile = ProfileDocument(
        user_id=PydanticObjectId(),
        full_name="Ankit Sharma",
        contact_email="ankit@example.com",
        target_roles=["Backend Developer"],
        preferred_locations=["Bengaluru"],
        education=[
            EducationItem(degree="B.Tech CSE", college="Institute of Tech", graduation_year=2025)
        ],
        skills=[
            SkillItem(name="Python"),
            SkillItem(name="FastAPI"),
            SkillItem(name="MongoDB"),
        ],
        projects=[
            ProjectItem(name="AI Agent", description="Career platform")
        ],
        certifications=[
            CertificationItem(name="AWS Certified Developer", issuer="Amazon")
        ],
    )
    score = ProfileService.calculate_completion_score(profile)
    assert score == 100
