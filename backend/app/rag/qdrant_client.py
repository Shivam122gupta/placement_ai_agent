import logging
import os
from typing import Optional
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PayloadSchemaType
from app.core.config import settings

logger = logging.getLogger("app.rag")

CANDIDATE_MEMORY_COLLECTION = "candidate_memory"
JOB_VECTORS_COLLECTION = "job_vectors"

_qdrant_client: Optional[QdrantClient] = None
_local_fallback_client: Optional[QdrantClient] = None


def get_local_fallback_client() -> QdrantClient:
    """Returns a local embedded / in-memory Qdrant client fallback."""
    global _local_fallback_client
    if _local_fallback_client is not None:
        return _local_fallback_client
    try:
        storage_path = os.path.join(os.getcwd(), "storage", "qdrant_data")
        os.makedirs(storage_path, exist_ok=True)
        _local_fallback_client = QdrantClient(path=storage_path)
    except Exception:
        _local_fallback_client = QdrantClient(":memory:")
    ensure_collections(_local_fallback_client)
    return _local_fallback_client


def get_qdrant_client() -> QdrantClient:
    """
    Returns a singleton QdrantClient instance.
    If QDRANT_URL is configured and reachable, connects to remote Qdrant.
    Otherwise, gracefully initializes an embedded local / in-memory instance.
    """
    global _qdrant_client
    if _qdrant_client is not None:
        return _qdrant_client

    try:
        if settings.QDRANT_URL and not settings.QDRANT_URL.startswith("http://localhost") and not settings.QDRANT_URL.startswith("http://127.0.0.1"):
            _qdrant_client = QdrantClient(
                url=settings.QDRANT_URL,
                api_key=settings.QDRANT_API_KEY or None,
                timeout=10.0
            )
            # Test connectivity
            _qdrant_client.get_collections()
            logger.info("Connected to remote Qdrant at %s", settings.QDRANT_URL)
        else:
            # Check if local Qdrant server is running on localhost
            try:
                test_client = QdrantClient(url=settings.QDRANT_URL, timeout=1.5)
                test_client.get_collections()
                _qdrant_client = test_client
                logger.info("Connected to local Qdrant server at %s", settings.QDRANT_URL)
            except Exception:
                _qdrant_client = get_local_fallback_client()
    except Exception as e:
        logger.warning("Falling back to local Qdrant instance due to: %s", e)
        _qdrant_client = get_local_fallback_client()

    ensure_collections(_qdrant_client)
    return _qdrant_client


def ensure_collections(client: Optional[QdrantClient] = None):
    """
    Ensures that required vector collections and payload indexes exist in Qdrant.
    """
    if client is None:
        client = get_qdrant_client()

    dim = settings.EMBEDDING_DIMENSION

    try:
        collections_response = client.get_collections()
        existing_names = [c.name for c in collections_response.collections]

        # 1. Candidate Memory Collection
        if CANDIDATE_MEMORY_COLLECTION not in existing_names:
            client.create_collection(
                collection_name=CANDIDATE_MEMORY_COLLECTION,
                vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
            )
            logger.info("Created Qdrant collection: %s (dim=%d)", CANDIDATE_MEMORY_COLLECTION, dim)
            
            # Create payload indexes
            try:
                client.create_payload_index(
                    collection_name=CANDIDATE_MEMORY_COLLECTION,
                    field_name="user_id",
                    field_schema=PayloadSchemaType.KEYWORD,
                )
                client.create_payload_index(
                    collection_name=CANDIDATE_MEMORY_COLLECTION,
                    field_name="doc_type",
                    field_schema=PayloadSchemaType.KEYWORD,
                )
            except Exception as idx_err:
                logger.debug("Payload index creation notice: %s", idx_err)

        # 2. Job Vectors Collection
        if JOB_VECTORS_COLLECTION not in existing_names:
            client.create_collection(
                collection_name=JOB_VECTORS_COLLECTION,
                vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
            )
            logger.info("Created Qdrant collection: %s (dim=%d)", JOB_VECTORS_COLLECTION, dim)
            try:
                client.create_payload_index(
                    collection_name=JOB_VECTORS_COLLECTION,
                    field_name="job_id",
                    field_schema=PayloadSchemaType.KEYWORD,
                )
            except Exception as idx_err:
                logger.debug("Payload index creation notice: %s", idx_err)

    except Exception as e:
        logger.error("Error setting up Qdrant collections: %s", e)
