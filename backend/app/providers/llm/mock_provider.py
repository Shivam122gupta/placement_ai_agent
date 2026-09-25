import json
from typing import Optional
from app.providers.llm.base import BaseLLMProvider


class MockLLMProvider(BaseLLMProvider):
    """Deterministic Mock LLM Provider for unit tests and offline testing."""

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.1) -> str:
        # Check if prompt is asking for resume extraction
        if "resume" in prompt.lower() or "skills" in prompt.lower():
            mock_data = {
                "full_name": "Ankit Sharma",
                "contact_email": "ankit.sharma@example.com",
                "phone": "+91 9876543210",
                "location": "Bengaluru, India",
                "linkedin_url": "https://linkedin.com/in/ankit-dev",
                "github_url": "https://github.com/ankit-dev",
                "summary": "B.Tech CSE Graduate specializing in Python, FastAPI, and MongoDB backend systems.",
                "education": [
                    {
                        "degree": "B.Tech Computer Science & Engineering",
                        "college": "National Institute of Technology",
                        "branch": "Computer Science",
                        "graduation_year": 2025,
                        "cgpa": 8.7,
                    }
                ],
                "skills": [
                    {"name": "Python", "category": "Programming Languages", "proficiency": "Advanced"},
                    {"name": "FastAPI", "category": "Frameworks", "proficiency": "Advanced"},
                    {"name": "MongoDB", "category": "Databases", "proficiency": "Intermediate"},
                    {"name": "Docker", "category": "DevOps", "proficiency": "Intermediate"},
                    {"name": "Machine Learning", "category": "AI/ML", "proficiency": "Beginner"},
                ],
                "experience": [
                    {
                        "company": "Tech Innovations Inc",
                        "role": "Backend Intern",
                        "duration": "May 2024 - July 2024",
                        "location": "Bengaluru, India",
                        "highlights": [
                            "Built RESTful microservices using FastAPI and MongoDB",
                            "Reduced query latency by 40% with database indexing",
                        ],
                    }
                ],
                "projects": [
                    {
                        "name": "AI Placement Agent",
                        "description": "Multi-agent career copilot for job discovery and interview preparation",
                        "technologies": ["Python", "FastAPI", "MongoDB", "Qdrant", "React"],
                        "github_url": "https://github.com/ankit-dev/ai-placement-agent",
                        "role": "Lead Architect",
                    }
                ],
                "certifications": [
                    {
                        "name": "MongoDB Certified Developer",
                        "issuer": "MongoDB University",
                        "issue_date": "2024-03",
                        "credential_url": "https://university.mongodb.com/verify/123",
                    }
                ],
                "achievements": [
                    "Winner of University Smart Hackathon 2024",
                    "Top 5% in competitive programming rankings",
                ],
            }
            return json.dumps(mock_data)

        return json.dumps({"message": "Mock LLM text response"})
