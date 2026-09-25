"""
Database Seeding Script for AI Placement Agent.
Seeds curated job openings and sample candidate profiles using environment configuration.
Usage:
    python -m scripts.seed_database
"""

import asyncio
from app.db.session import init_db, get_db_client
from app.models.job import Job
from app.core.logging import get_logger

logger = get_logger("seed_database")

SAMPLE_JOBS = [
    {
        "title": "Junior Backend Engineer (Python/FastAPI)",
        "company": "Stripe",
        "location": "San Francisco, CA (Remote)",
        "job_type": "Full-Time",
        "experience_level": "Entry-Level",
        "min_experience_years": 0.5,
        "salary_range": "$115,000 - $140,000",
        "description": "We are seeking a proactive Junior Backend Engineer to help scale our payment infrastructure. You will design, build, and maintain high-throughput RESTful APIs using Python, FastAPI, and PostgreSQL. You will write clean, well-tested code and collaborate with senior engineers on distributed systems.",
        "skills_required": ["Python", "FastAPI", "PostgreSQL", "REST APIs", "Git"],
        "skills_preferred": ["Docker", "Redis", "Distributed Systems", "CI/CD"],
        "raw_text": "Junior Backend Engineer at Stripe. Requirements: Python, FastAPI, PostgreSQL, REST APIs. Preferred: Docker, Redis.",
        "external_url": "https://stripe.com/jobs/junior-backend",
        "source": "manual",
    },
    {
        "title": "Frontend Engineer (React & TypeScript)",
        "company": "Vercel",
        "location": "Remote",
        "job_type": "Full-Time",
        "experience_level": "Entry-Level / Associate",
        "min_experience_years": 1.0,
        "salary_range": "$110,000 - $135,000",
        "description": "Join Vercel to build next-generation developer tooling. Work closely with design and product teams to implement high-performance, accessible React web applications using TypeScript and Tailwind CSS.",
        "skills_required": ["React", "TypeScript", "JavaScript", "HTML5", "CSS3", "Tailwind CSS"],
        "skills_preferred": ["Next.js", "GraphQL", "Web Performance Optimization"],
        "raw_text": "Frontend Engineer at Vercel. Requirements: React, TypeScript, Tailwind CSS.",
        "external_url": "https://vercel.com/careers/frontend",
        "source": "manual",
    },
    {
        "title": "AI / ML Systems Engineer",
        "company": "Anthropic",
        "location": "San Francisco, CA (Hybrid)",
        "job_type": "Full-Time",
        "experience_level": "Entry-Level / Junior",
        "min_experience_years": 1.0,
        "salary_range": "$140,000 - $175,000",
        "description": "Anthropic is looking for an AI Systems Engineer to build reliable agentic evaluation pipelines and RAG vector retrieval systems. Work with LLMs, embeddings, and vector databases.",
        "skills_required": ["Python", "LLMs", "Vector Databases", "PyTorch", "FastAPI"],
        "skills_preferred": ["Qdrant", "LangChain", "RAG", "Prompt Engineering"],
        "raw_text": "AI/ML Systems Engineer at Anthropic. Requirements: Python, LLMs, Vector Databases.",
        "external_url": "https://anthropic.com/careers/ai-systems",
        "source": "manual",
    },
]

async def seed():
    logger.info("Initializing database connection for seeding...")
    await init_db()
    
    logger.info("Checking existing jobs in database...")
    created_count = 0
    for job_data in SAMPLE_JOBS:
        existing = await Job.find_one(Job.title == job_data["title"], Job.company == job_data["company"])
        if not existing:
            job = Job(**job_data)
            await job.insert()
            created_count += 1
            logger.info(f"Seeded job: {job.title} at {job.company}")
        else:
            logger.info(f"Job already exists: {job_data['title']} at {job_data['company']}")
            
    logger.info(f"Database seeding completed! Seeded {created_count} new job postings.")

if __name__ == "__main__":
    asyncio.run(seed())
