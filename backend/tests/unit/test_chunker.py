import pytest
from app.rag.chunker import SectionAwareChunker, CandidateChunk


def test_chunk_profile_sections():
    profile_data = {
        "full_name": "Ankit Sharma",
        "headline": "Junior Backend Developer",
        "target_roles": ["Backend Engineer", "Python Developer"],
        "preferred_locations": ["Remote", "Bengaluru"],
        "experience_level": "0-1 years",
        "work_preference": "Remote",
        "skills": [
            {"name": "Python", "category": "Programming Languages", "proficiency": "Advanced"},
            {"name": "FastAPI", "category": "Frameworks", "proficiency": "Intermediate"},
            {"name": "Docker", "category": "DevOps", "proficiency": "Intermediate"},
        ],
        "projects": [
            {
                "name": "E-Commerce Gateway",
                "description": "High throughput payment gateway built with FastAPI and Redis cache.",
                "technologies": ["FastAPI", "Redis", "PostgreSQL"],
                "github_url": "https://github.com/ankit/gateway",
                "role": "Lead Architect",
            }
        ],
        "experiences": [
            {
                "company": "Tech Corp",
                "role": "Backend Intern",
                "start_date": "2025-01",
                "end_date": "2025-06",
                "description": "Implemented JWT auth and optimized MongoDB queries.",
                "skills_used": ["Python", "MongoDB", "JWT"],
            }
        ],
        "education": [
            {
                "college": "State Engineering College",
                "degree": "B.Tech",
                "branch": "Computer Science",
                "graduation_year": 2025,
                "cgpa": 8.8,
            }
        ],
    }

    chunks = SectionAwareChunker.chunk_profile(profile_data, user_id="user_test_123")

    assert len(chunks) >= 5
    sections = [c.section for c in chunks]
    assert "SUMMARY" in sections
    assert "SKILLS" in sections
    assert "PROJECTS" in sections
    assert "EXPERIENCE" in sections
    assert "EDUCATION" in sections

    # Check project chunk
    project_chunk = next(c for c in chunks if c.section == "PROJECTS")
    assert "E-Commerce Gateway" in project_chunk.title
    assert "FastAPI" in project_chunk.skills
    assert project_chunk.user_id == "user_test_123"


def test_chunk_resume():
    resume_data = {
        "id": "res_999",
        "parsed_data": {
            "summary": "Full stack engineer specializing in Python and React.",
            "skills": ["Python", "React", "TypeScript", "SQL"],
            "projects": [
                {
                    "name": "AI Job Matcher",
                    "technologies": ["Python", "Qdrant"],
                    "description": "Vector matching engine for candidate recommendations.",
                }
            ],
            "work_experience": [
                {
                    "company": "Data Startup",
                    "role": "Software Intern",
                    "technologies_used": ["Python", "Docker"],
                    "description": "Engineered data ingestion pipelines.",
                }
            ],
        },
    }

    chunks = SectionAwareChunker.chunk_resume(resume_data, user_id="user_test_456")
    assert len(chunks) == 3
    assert chunks[0].section == "SUMMARY"
    assert "AI Job Matcher" in chunks[1].title
    assert chunks[1].user_id == "user_test_456"
