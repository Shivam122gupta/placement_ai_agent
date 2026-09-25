from typing import List, Optional
from app.providers.jobs.base import BaseJobProvider, RawJobItem


MOCK_JOBS_DATABASE: List[dict] = [
    {
        "title": "Backend Developer Intern (Python / FastAPI)",
        "company": "Nexus AI Labs",
        "location": "Bengaluru, India (Hybrid)",
        "employment_type": "Internship",
        "description_raw": (
            "Nexus AI Labs is seeking a Backend Developer Intern to help build scalable microservices. "
            "You will develop high-throughput REST APIs using Python, FastAPI, and MongoDB, implement caching with Redis, "
            "and containerize services with Docker. Required Skills: Python, FastAPI, SQL/MongoDB, REST APIs, Git. "
            "Preferred Skills: Docker, Redis, Asynchronous Programming, AWS."
        ),
        "source": "Nexus Careers",
        "source_url": "https://nexus-ai.example.com/careers/backend-intern",
        "min_experience_years": 0.0,
        "required_skills": ["Python", "FastAPI", "MongoDB", "REST APIs", "Git"],
        "preferred_skills": ["Docker", "Redis", "AWS", "Asynchronous Programming"],
        "posted_at": "2026-03-20T10:00:00Z",
    },
    {
        "title": "AI / Machine Learning Engineer (Junior)",
        "company": "Cognitive Scale",
        "location": "Hyderabad, India (On-site)",
        "employment_type": "Full-time",
        "description_raw": (
            "Join our core AI research team to build cutting-edge LLM pipelines and RAG systems. "
            "Responsibilities include evaluating vector databases, prompt engineering, fine-tuning open-source models, "
            "and deploying inference pipelines with FastAPI. Required Skills: Python, Machine Learning, PyTorch, LangChain, Vector Databases. "
            "Preferred Skills: Qdrant, Groq/OpenAI APIs, HuggingFace, Docker, Kubernetes."
        ),
        "source": "Cognitive Careers",
        "source_url": "https://cognitivescale.example.com/jobs/junior-ai-engineer",
        "min_experience_years": 0.5,
        "required_skills": ["Python", "Machine Learning", "PyTorch", "Vector Databases", "Git"],
        "preferred_skills": ["Qdrant", "FastAPI", "Docker", "HuggingFace", "RAG"],
        "posted_at": "2026-03-22T08:30:00Z",
    },
    {
        "title": "Full Stack Developer Intern (React + Python)",
        "company": "Apex Fintech Solutions",
        "location": "Remote (India)",
        "employment_type": "Internship",
        "description_raw": (
            "We are looking for a proactive Full Stack Intern. You will build user-facing responsive dashboards in React and TypeScript "
            "while connecting to FastAPI backend services. Required Skills: React, TypeScript, JavaScript, Python, Tailwind CSS, REST APIs. "
            "Preferred Skills: Next.js, MongoDB, PostgreSQL, CI/CD, Unit Testing."
        ),
        "source": "Apex Tech Portal",
        "source_url": "https://apexfintech.example.com/internships/fullstack",
        "min_experience_years": 0.0,
        "required_skills": ["React", "TypeScript", "Python", "JavaScript", "Tailwind CSS"],
        "preferred_skills": ["FastAPI", "MongoDB", "PostgreSQL", "Next.js"],
        "posted_at": "2026-03-24T14:15:00Z",
    },
    {
        "title": "Data Science & Analytics Intern",
        "company": "QuantPulse Analytics",
        "location": "Pune, India (Hybrid)",
        "employment_type": "Internship",
        "description_raw": (
            "Analyze large-scale transactional datasets and create predictive models. "
            "Required Skills: Python, SQL, Pandas, NumPy, Data Visualization (Matplotlib/Seaborn), Statistics. "
            "Preferred Skills: Scikit-learn, BigQuery, Tableau, Machine Learning, FastAPI."
        ),
        "source": "QuantPulse Portal",
        "source_url": "https://quantpulse.example.com/careers/ds-intern",
        "min_experience_years": 0.0,
        "required_skills": ["Python", "SQL", "Pandas", "NumPy", "Statistics"],
        "preferred_skills": ["Scikit-learn", "Machine Learning", "Data Visualization", "FastAPI"],
        "posted_at": "2026-03-25T11:00:00Z",
    },
    {
        "title": "DevOps & Cloud Intern",
        "company": "CloudForge Systems",
        "location": "Bengaluru, India (On-site)",
        "employment_type": "Internship",
        "description_raw": (
            "Assist in managing CI/CD pipelines, container orchestration, and cloud infrastructure monitoring. "
            "Required Skills: Linux, Docker, Git, Bash Scripting, Basic Networking. "
            "Preferred Skills: Kubernetes, AWS, Terraform, GitHub Actions, Python."
        ),
        "source": "CloudForge Careers",
        "source_url": "https://cloudforge.example.com/jobs/devops-intern",
        "min_experience_years": 0.0,
        "required_skills": ["Linux", "Docker", "Git", "Bash Scripting"],
        "preferred_skills": ["Kubernetes", "AWS", "GitHub Actions", "Python", "Terraform"],
        "posted_at": "2026-03-25T16:45:00Z",
    },
]


class MockJobProvider(BaseJobProvider):
    async def search_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        employment_type: Optional[str] = None,
        skills: Optional[List[str]] = None,
        limit: int = 20,
    ) -> List[RawJobItem]:
        q_lower = query.lower().strip()
        loc_lower = location.lower().strip() if location else ""
        emp_lower = employment_type.lower().strip() if employment_type else ""

        results = []
        for job_dict in MOCK_JOBS_DATABASE:
            # Query match on title, company, or description
            title_match = (
                not q_lower
                or q_lower in job_dict["title"].lower()
                or q_lower in job_dict["company"].lower()
                or q_lower in job_dict["description_raw"].lower()
            )
            # Location filter
            loc_match = not loc_lower or loc_lower in job_dict["location"].lower()
            # Employment type filter
            emp_match = not emp_lower or emp_lower in job_dict["employment_type"].lower()

            if title_match and loc_match and emp_match:
                results.append(RawJobItem(**job_dict))
                if len(results) >= limit:
                    break

        # If no strict matches found, return all available mock jobs to ensure developer experience
        if not results and (not q_lower and not loc_lower):
            results = [RawJobItem(**j) for j in MOCK_JOBS_DATABASE[:limit]]

        return results
