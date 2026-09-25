import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from mongomock_motor import AsyncMongoMockClient
from beanie import init_beanie

from app.main import app
from app.models.user import UserDocument
from app.models.profile import ProfileDocument
from app.models.resume import ResumeDocument, ResumeVersionDocument
from app.models.job import JobDocument
from app.core.security import get_password_hash, create_access_token


import mongomock

# Monkey-patch mongomock to accept keyword arguments like authorizedCollections, nameOnly from Beanie 2.2
_orig_list_collection_names = mongomock.database.Database.list_collection_names


def _patched_list_collection_names(self, *args, **kwargs):
    # filter out unsupported kwargs for mongomock
    clean_kwargs = {k: v for k, v in kwargs.items() if k not in ["authorizedCollections", "nameOnly"]}
    return _orig_list_collection_names(self, *args, **clean_kwargs)


mongomock.database.Database.list_collection_names = _patched_list_collection_names


from app.models.matching import JobMatchDocument
from app.models.skill_gap import SkillGapRoadmapDocument
from app.models.agent_trace import AgentRunDocument, AgentToolCallDocument
from app.models.interview import MockInterviewDocument
from app.models.application import ApplicationDocument
from app.models.notification import NotificationDocument


@pytest_asyncio.fixture(autouse=True)
async def mock_db():
    mock_client = AsyncMongoMockClient()
    db = mock_client.test_ai_placement_db
    
    await init_beanie(
        database=db,
        document_models=[
            UserDocument,
            ProfileDocument,
            ResumeDocument,
            ResumeVersionDocument,
            JobDocument,
            JobMatchDocument,
            SkillGapRoadmapDocument,
            AgentRunDocument,
            AgentToolCallDocument,
            MockInterviewDocument,
            ApplicationDocument,
            NotificationDocument,
        ],
    )
    yield db
    mock_client.close()




@pytest_asyncio.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture
async def test_user(mock_db):
    user = UserDocument(
        email="candidate@test.com",
        hashed_password=get_password_hash("TestPassword123!"),
        is_active=True,
        is_verified=True,
    )
    await user.insert()
    
    profile = ProfileDocument(
        user_id=user.id,
        full_name="Test Candidate",
        contact_email="candidate@test.com",
    )
    await profile.insert()
    return user


@pytest_asyncio.fixture
def auth_headers(test_user):
    token = create_access_token(subject=str(test_user.id))
    return {"Authorization": f"Bearer {token}"}
