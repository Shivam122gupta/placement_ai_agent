from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    profile,
    health,
    resumes,
    jobs,
    matching,
    skill_gaps,
    agent,
    memory,
    interviews,
    applications,
    notifications,
)

api_v1_router = APIRouter()

api_v1_router.include_router(health.router)
api_v1_router.include_router(auth.router)
api_v1_router.include_router(profile.router)
api_v1_router.include_router(resumes.router)
api_v1_router.include_router(jobs.router)
api_v1_router.include_router(matching.router, tags=["Candidate-Job Matching"])
api_v1_router.include_router(skill_gaps.router, prefix="/skill-gaps", tags=["Skill Gap Roadmaps"])
api_v1_router.include_router(agent.router, prefix="/agent", tags=["AI Placement Agent"])
api_v1_router.include_router(memory.router, prefix="/memory", tags=["Semantic Candidate Memory"])
api_v1_router.include_router(interviews.router, prefix="/interviews", tags=["Mock Interviews & Evaluation"])
api_v1_router.include_router(applications.router, prefix="/applications", tags=["Application Pipeline"])
api_v1_router.include_router(notifications.router, prefix="/notifications", tags=["In-App Notifications"])



