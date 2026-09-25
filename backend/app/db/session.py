import logging
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.user import UserDocument
from app.models.profile import ProfileDocument
from app.models.resume import ResumeDocument, ResumeVersionDocument
from app.models.job import JobDocument
from app.models.matching import JobMatchDocument
from app.models.skill_gap import SkillGapRoadmapDocument
from app.models.agent_trace import AgentRunDocument, AgentToolCallDocument
from app.models.interview import MockInterviewDocument
from app.models.application import ApplicationDocument
from app.models.notification import NotificationDocument

import certifi
from mongomock_motor import AsyncMongoMockClient

# Patch AsyncIOMotorClient for Beanie 2.2 metadata driver call
AsyncIOMotorClient.append_metadata = lambda *args, **kwargs: None

logger = logging.getLogger("app.db")

client: AsyncIOMotorClient = None


async def init_db(mongodb_url: str = None, db_name: str = None):
    global client
    url = mongodb_url or settings.MONGODB_URL
    database_name = db_name or settings.MONGODB_DB_NAME
    
    logger.info(f"Connecting to MongoDB database: {database_name}...")
    
    # Motor client options with SSL certifi support
    client_kwargs = {
        "serverSelectionTimeoutMS": 3000,
        "connectTimeoutMS": 3000,
    }
    if "mongodb+srv://" in url or "ssl=true" in url.lower():
        client_kwargs["tlsCAFile"] = certifi.where()

    try:
        real_client = AsyncIOMotorClient(url, **client_kwargs)
        # Verify connectivity
        await real_client.admin.command('ping')
        client = real_client
        logger.info(f"Successfully connected to MongoDB ({url[:25]}...).")
        
        await init_beanie(
            database=client[database_name],
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
    except Exception as err:
        logger.warning(
            f"Could not connect to external MongoDB ({err}). "
            "Falling back to local in-memory mock MongoDB for seamless development & testing."
        )
        mock_client = AsyncMongoMockClient()
        client = mock_client
        await init_beanie(
            database=client[database_name],
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
    
    logger.info("MongoDB and Beanie ODM initialized successfully.")




async def close_db():
    global client
    if client:
        logger.info("Closing MongoDB connection...")
        client.close()
        logger.info("MongoDB connection closed.")


def get_db_client() -> AsyncIOMotorClient:
    return client
