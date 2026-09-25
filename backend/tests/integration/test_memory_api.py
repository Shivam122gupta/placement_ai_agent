import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_memory_sync_search_and_notes_flow(async_client: AsyncClient, auth_headers: dict):
    # 1. Setup profile data
    await async_client.patch("/api/v1/profile", json={
        "full_name": "RAG Specialist",
        "headline": "AI Engineer with Vector DB expertise",
        "target_roles": ["AI Engineer", "MLOps Engineer"],
    }, headers=auth_headers)

    await async_client.post("/api/v1/profile/skills", json={"name": "Qdrant", "proficiency": "Expert"}, headers=auth_headers)
    await async_client.post("/api/v1/profile/skills", json={"name": "PyTorch", "proficiency": "Advanced"}, headers=auth_headers)

    await async_client.post("/api/v1/profile/projects", json={
        "name": "Distributed Vector Search Engine",
        "description": "Implemented HNSW indexing with Qdrant and fast embeddings for sub-millisecond retrieval.",
        "technologies": ["Python", "Qdrant", "FastEmbed", "Docker"],
    }, headers=auth_headers)

    # 2. Sync memory
    sync_res = await async_client.post("/api/v1/memory/sync", headers=auth_headers)
    assert sync_res.status_code == 200
    sync_data = sync_res.json()
    assert sync_data["success"] is True
    assert sync_data["chunks_indexed"] > 0
    assert sync_data["profile_chunks"] > 0

    # 3. Add a custom candidate note
    note_payload = {
        "title": "HNSW Algorithm Takeaways",
        "content": "Hierarchical Navigable Small World graphs provide logarithmic search complexity with high recall.",
        "tags": ["HNSW", "Algorithms", "VectorDB"],
    }
    note_res = await async_client.post("/api/v1/memory/notes", json=note_payload, headers=auth_headers)
    assert note_res.status_code == 201
    note_data = note_res.json()
    assert "chunk_id" in note_data
    assert note_data["title"] == "HNSW Algorithm Takeaways"

    # 4. Search memory
    search_payload = {
        "query": "HNSW graphs logarithmic search complexity and vector databases",
        "top_k": 3,
    }
    search_res = await async_client.post("/api/v1/memory/search", json=search_payload, headers=auth_headers)
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["total_found"] > 0
    assert len(search_data["results"]) > 0

    # 5. Check memory stats
    stats_res = await async_client.get("/api/v1/memory/stats", headers=auth_headers)
    assert stats_res.status_code == 200
    stats_data = stats_res.json()
    assert stats_data["total_chunks"] >= 2
    assert "profile_project" in stats_data["doc_type_breakdown"] or "skills" in stats_data["doc_type_breakdown"]

    # 6. Clear candidate memory
    clear_res = await async_client.delete("/api/v1/memory/clear", headers=auth_headers)
    assert clear_res.status_code == 200
    assert clear_res.json()["success"] is True

    # 7. Verify stats are empty after clearing
    empty_stats = await async_client.get("/api/v1/memory/stats", headers=auth_headers)
    assert empty_stats.status_code == 200
    assert empty_stats.json()["total_chunks"] == 0
