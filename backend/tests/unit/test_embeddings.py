import math
import pytest
from app.providers.embeddings import DeterministicEmbeddingProvider, get_embedding_provider


def test_deterministic_embedding_dimensions():
    provider = DeterministicEmbeddingProvider(dimension=384)
    vec = provider.embed_text("FastAPI backend with Qdrant vector database")

    assert len(vec) == 384
    # Ensure vector is unit normalized (L2 norm == 1.0)
    norm = math.sqrt(sum(v * v for v in vec))
    assert abs(norm - 1.0) < 1e-4


def test_embedding_batch():
    provider = get_embedding_provider()
    texts = [
        "Distributed message queues with Apache Kafka",
        "React frontend development with TypeScript",
        "Machine learning model evaluation with PyTest",
    ]
    vectors = provider.embed_batch(texts)

    assert len(vectors) == 3
    for vec in vectors:
        assert len(vec) == 384


def test_semantic_similarity_overlap():
    provider = DeterministicEmbeddingProvider(dimension=384)
    v1 = provider.embed_text("FastAPI backend development in Python")
    v2 = provider.embed_text("FastAPI python web development framework")
    v3 = provider.embed_text("Culinary arts and gourmet baking pastry recipes")

    # Cosine similarity between normalized vectors is dot product
    def cosine_sim(a, b):
        return sum(x * y for x, y in zip(a, b))

    sim_related = cosine_sim(v1, v2)
    sim_unrelated = cosine_sim(v1, v3)

    assert sim_related > sim_unrelated
