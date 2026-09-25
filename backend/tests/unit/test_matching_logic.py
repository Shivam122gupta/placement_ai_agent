import pytest
from app.services.matching_service import MatchingService
from app.models.profile import ProfileDocument, SkillItem, ProjectItem
from beanie import PydanticObjectId


def test_skill_normalization():
    assert MatchingService.normalize_skill("JS") == "javascript"
    assert MatchingService.normalize_skill("ReactJS") == "react"
    assert MatchingService.normalize_skill("Postgres") == "postgresql"
    assert MatchingService.normalize_skill("k8s") == "kubernetes"
    assert MatchingService.normalize_skill("Node.js") == "nodejs"
    assert MatchingService.normalize_skill("FastAPI") == "fastapi"


def test_evaluate_skills_match_disjoint():
    required = ["Java", "Spring Boot"]
    preferred = ["AWS"]
    candidate_skills = {"python", "fastapi", "react"}
    evidence_map = {}

    score, matched, missing, partial, details = MatchingService.evaluate_skills_match(
        required_skills=required,
        preferred_skills=preferred,
        candidate_skills=candidate_skills,
        evidence_map=evidence_map,
    )

    assert score == 0
    assert len(matched) == 0
    assert len(missing) == 3  # Java, Spring Boot, AWS


def test_evaluate_skills_match_full_overlap():
    required = ["Python", "FastAPI"]
    preferred = ["Docker"]
    candidate_skills = {"python", "fastapi", "docker", "postgresql"}
    evidence_map = {
        "python": "Listed in Skills",
        "fastapi": "Built in Project A",
        "docker": "Demonstrated in Work",
    }

    score, matched, missing, partial, details = MatchingService.evaluate_skills_match(
        required_skills=required,
        preferred_skills=preferred,
        candidate_skills=candidate_skills,
        evidence_map=evidence_map,
    )

    assert score == 100
    assert len(matched) == 3
    assert len(missing) == 0
    assert any(d.evidence_snippet == "Listed in Skills" for d in details)


def test_candidate_skills_extraction_from_profile():
    dummy_user_id = PydanticObjectId()
    profile = ProfileDocument(
        user_id=dummy_user_id,
        full_name="Alex Dev",
        experience_level="1-3 years",
        skills=[
            SkillItem(name="ReactJS", proficiency="Advanced"),
            SkillItem(name="Python", proficiency="Intermediate"),
        ],
        projects=[
            ProjectItem(
                name="AI Placement Agent",
                description="Integrated FastAPI, Docker, and Redis with MongoDB",
                technologies=["TypeScript", "Next.js", "FastAPI"],
            )
        ],
    )

    cand_skills, evidence = MatchingService.extract_candidate_skills_and_evidence(profile)
    assert "react" in cand_skills
    assert "python" in cand_skills
    assert "fastapi" in cand_skills
    assert "docker" in cand_skills
    assert "redis" in cand_skills
    assert "typescript" in cand_skills
    assert "nextjs" in cand_skills
    assert "mongodb" in cand_skills
