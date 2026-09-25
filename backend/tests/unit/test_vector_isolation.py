import pytest
from app.rag.chunker import CandidateChunk
from app.services.memory_service import memory_service


def test_strict_multi_tenant_vector_isolation():
    user_a = "candidate_alice_101"
    user_b = "candidate_bob_202"

    # Purge any previous test data
    memory_service.delete_candidate_memory(user_id=user_a)
    memory_service.delete_candidate_memory(user_id=user_b)

    # 1. Index proprietary project for Candidate Bob
    bob_chunks = [
        CandidateChunk(
            user_id=user_b,
            doc_type="profile_project",
            title="Project TopSecretQuantumEngine",
            content="Proprietary TopSecretQuantumEngine built by Bob utilizing superconducting flux qubits.",
            section="PROJECTS",
            skills=["Quantum", "Python"],
            source_id="bob_project_1",
        )
    ]
    memory_service.index_chunks(bob_chunks)

    # 2. Index common project for Candidate Alice
    alice_chunks = [
        CandidateChunk(
            user_id=user_a,
            doc_type="profile_project",
            title="Project PublicCommerce",
            content="Standard ecommerce API with FastAPI and PostgreSQL.",
            section="PROJECTS",
            skills=["FastAPI", "PostgreSQL"],
            source_id="alice_project_1",
        )
    ]
    memory_service.index_chunks(alice_chunks)

    # 3. Query Candidate Alice's memory for "TopSecretQuantumEngine"
    alice_search = memory_service.search_candidate_memory(
        user_id=user_a,
        query="TopSecretQuantumEngine superconducting flux qubits",
        top_k=5,
    )

    # Alice must NEVER see Bob's data
    for result in alice_search:
        assert "TopSecretQuantumEngine" not in result.title
        assert "Bob" not in result.content

    # 4. Query Candidate Bob's memory for "TopSecretQuantumEngine"
    bob_search = memory_service.search_candidate_memory(
        user_id=user_b,
        query="TopSecretQuantumEngine superconducting flux qubits",
        top_k=5,
    )

    assert len(bob_search) > 0
    assert "TopSecretQuantumEngine" in bob_search[0].title

    # Cleanup
    memory_service.delete_candidate_memory(user_id=user_a)
    memory_service.delete_candidate_memory(user_id=user_b)
