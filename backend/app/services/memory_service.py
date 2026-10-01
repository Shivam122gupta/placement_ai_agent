import logging
import uuid
from typing import List, Dict, Any, Optional
from qdrant_client.http import models
from qdrant_client.http.models import PointStruct, Filter, FieldCondition, MatchValue, MatchAny

from app.rag.qdrant_client import get_qdrant_client, CANDIDATE_MEMORY_COLLECTION
from app.providers.embeddings import get_embedding_provider
from app.rag.chunker import SectionAwareChunker, CandidateChunk
from app.schemas.memory import (
    MemorySearchResultItem,
    CandidateNoteCreate,
    CandidateNoteResponse,
    MemoryStatsResponse,
    MemorySyncResponse
)

logger = logging.getLogger("app.memory")


class MemoryService:
    def __init__(self):
        self.embedder = get_embedding_provider()
        self.collection_name = CANDIDATE_MEMORY_COLLECTION

    @property
    def client(self):
        return get_qdrant_client()

    def _execute_with_fallback(self, func, *args, **kwargs):
        """Executes a function against Qdrant, falling back to local client on error."""
        try:
            return func(self.client, *args, **kwargs)
        except Exception as primary_err:
            logger.warning("Primary Qdrant operation failed: %s. Attempting fallback to local instance...", primary_err)
            from app.rag.qdrant_client import get_local_fallback_client
            fallback_client = get_local_fallback_client()
            return func(fallback_client, *args, **kwargs)

    def _generate_point_id(self, chunk_id: str) -> str:
        # Generate valid UUID string for Qdrant
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk_id))

    def index_chunks(self, chunks: List[CandidateChunk]) -> int:
        """Embeds and indexes a list of candidate chunks into Qdrant."""
        if not chunks:
            return 0

        texts = [chunk.content for chunk in chunks]
        vectors = self.embedder.embed_batch(texts)

        points = []
        for chunk, vector in zip(chunks, vectors):
            point_id = self._generate_point_id(chunk.chunk_id)
            payload = chunk.to_payload()
            points.append(PointStruct(id=point_id, vector=vector, payload=payload))

        def _do_upsert(c):
            return c.upsert(
                collection_name=self.collection_name,
                points=points,
                wait=True,
            )

        self._execute_with_fallback(_do_upsert)
        logger.info("Successfully indexed %d chunks into %s", len(points), self.collection_name)
        return len(points)

    def delete_candidate_memory(self, user_id: str, chunk_id: Optional[str] = None) -> bool:
        """
        Deletes vector memory for a user.
        If chunk_id is provided, deletes only that chunk. Otherwise purges all user chunks.
        """
        conditions = [
            FieldCondition(key="user_id", match=MatchValue(value=str(user_id)))
        ]
        if chunk_id:
            conditions.append(
                FieldCondition(key="chunk_id", match=MatchValue(value=str(chunk_id)))
            )

        def _do_delete(c):
            try:
                c.delete(
                    collection_name=self.collection_name,
                    points_selector=models.FilterSelector(
                        filter=Filter(must=conditions)
                    ),
                    wait=True,
                )
            except Exception:
                c.delete(
                    collection_name=self.collection_name,
                    points_selector=Filter(must=conditions),
                    wait=True,
                )

        try:
            self._execute_with_fallback(_do_delete)
            logger.info("Deleted memory vectors for user_id=%s, chunk_id=%s", user_id, chunk_id)
        except Exception as e:
            logger.warning("Notice on deleting vector memory for user %s: %s", user_id, e)
        return True

    @classmethod
    async def sync_resume_to_memory(cls, user_id: Any, resume_id: Any, parsed_data: Any) -> int:
        """Indexes parsed resume data into vector memory directly."""
        try:
            p_dict = parsed_data.model_dump() if hasattr(parsed_data, "model_dump") else (parsed_data if isinstance(parsed_data, dict) else {})
            resume_dict = {
                "id": str(resume_id),
                "parsed_data": p_dict,
                "raw_text": "",
            }
            chunks = SectionAwareChunker.chunk_resume(resume_dict, user_id=str(user_id))
            if chunks:
                indexed = memory_service.index_chunks(chunks)
                logger.info("Auto-synced %d resume chunks into vector memory for user %s", indexed, user_id)
                return indexed
            return 0
        except Exception as e:
            logger.warning("Error auto-syncing resume to memory for user %s: %s", user_id, e)
            return 0

    def sync_candidate_memory(
        self,
        user_id: str,
        profile_dict: Optional[Dict[str, Any]] = None,
        resumes: Optional[List[Dict[str, Any]]] = None
    ) -> MemorySyncResponse:
        """
        Full synchronization: Purges previous profile/resume memory and re-indexes all active candidate data.
        """
        user_id_str = str(user_id)
        
        # 1. Purge old profile & resume memory for this candidate
        self.delete_candidate_memory(user_id=user_id_str)

        all_chunks: List[CandidateChunk] = []

        # 2. Chunk profile
        profile_chunk_count = 0
        if profile_dict:
            p_chunks = SectionAwareChunker.chunk_profile(profile_dict, user_id=user_id_str)
            all_chunks.extend(p_chunks)
            profile_chunk_count = len(p_chunks)

        # 3. Chunk resumes
        resume_chunk_count = 0
        if resumes:
            for r in resumes:
                r_chunks = SectionAwareChunker.chunk_resume(r, user_id=user_id_str)
                all_chunks.extend(r_chunks)
                resume_chunk_count += len(r_chunks)

        # 4. Index all chunks
        total_indexed = self.index_chunks(all_chunks)

        return MemorySyncResponse(
            success=True,
            message=f"Synchronized {total_indexed} semantic knowledge chunks.",
            chunks_indexed=total_indexed,
            profile_chunks=profile_chunk_count,
            resume_chunks=resume_chunk_count,
        )

    def add_candidate_note(self, user_id: str, note: CandidateNoteCreate) -> CandidateNoteResponse:
        """Stores and embeds a custom candidate learning note or system design takeaway."""
        note_dict = {
            "title": note.title,
            "content": note.content,
            "tags": note.tags,
            "note_id": f"note_{uuid.uuid4().hex[:8]}",
        }
        chunk = SectionAwareChunker.chunk_note(note_dict, user_id=str(user_id))
        self.index_chunks([chunk])

        return CandidateNoteResponse(
            chunk_id=chunk.chunk_id,
            title=chunk.title,
            content=chunk.content,
            tags=chunk.skills,
            created_at=chunk.created_at,
        )

    def search_candidate_memory(
        self,
        user_id: str,
        query: str,
        doc_types: Optional[List[str]] = None,
        top_k: int = 5,
        score_threshold: float = 0.0,
    ) -> List[MemorySearchResultItem]:
        """
        Performs tenant-isolated cosine similarity vector search over the candidate's personal memory.
        STRICT SECURITY: Query filter MUST ALWAYS enforce user_id == current_user.id.
        """
        if not user_id:
            raise ValueError("user_id is mandatory for vector isolation")

        query_vector = self.embedder.embed_text(query)

        filter_conditions = [
            FieldCondition(key="user_id", match=MatchValue(value=str(user_id)))
        ]
        if doc_types and len(doc_types) > 0:
            filter_conditions.append(
                FieldCondition(key="doc_type", match=MatchAny(any=doc_types))
            )

        tenant_filter = Filter(must=filter_conditions)

        def _do_search(c):
            if hasattr(c, "query_points"):
                query_res = c.query_points(
                    collection_name=self.collection_name,
                    query=query_vector,
                    query_filter=tenant_filter,
                    limit=top_k,
                    score_threshold=score_threshold if score_threshold > 0.0 else None,
                )
                return query_res.points
            else:
                return c.search(
                    collection_name=self.collection_name,
                    query_vector=query_vector,
                    query_filter=tenant_filter,
                    limit=top_k,
                    score_threshold=score_threshold if score_threshold > 0.0 else None,
                )

        try:
            search_results = self._execute_with_fallback(_do_search)
        except Exception as e:
            logger.error("Search execution failed across all clients: %s", e)
            search_results = []

        results: List[MemorySearchResultItem] = []
        for r in search_results:
            payload = r.payload or {}
            results.append(
                MemorySearchResultItem(
                    chunk_id=str(payload.get("chunk_id", r.id)),
                    title=str(payload.get("title", "Untitled Chunk")),
                    content=str(payload.get("content", "")),
                    section=str(payload.get("section", "GENERAL")),
                    doc_type=str(payload.get("doc_type", "unknown")),
                    skills=payload.get("skills", []),
                    score=float(r.score or 0.0),
                    source_id=payload.get("source_id"),
                    created_at=payload.get("created_at"),
                )
            )

        return results

    def get_memory_stats(self, user_id: str) -> MemoryStatsResponse:
        """Retrieves vector statistics and doc_type breakdowns for a user."""
        user_id_str = str(user_id)
        tenant_filter = Filter(
            must=[FieldCondition(key="user_id", match=MatchValue(value=user_id_str))]
        )

        doc_counts: Dict[str, int] = {}
        total = 0

        def _do_scroll(c):
            nonlocal total, doc_counts
            doc_counts = {}
            total = 0
            offset = None
            while True:
                scroll_res, next_offset = c.scroll(
                    collection_name=self.collection_name,
                    scroll_filter=tenant_filter,
                    limit=100,
                    offset=offset,
                    with_payload=True,
                    with_vectors=False,
                )
                for pt in scroll_res:
                    total += 1
                    dtype = pt.payload.get("doc_type", "other") if pt.payload else "other"
                    doc_counts[dtype] = doc_counts.get(dtype, 0) + 1

                if next_offset is None:
                    break
                offset = next_offset
            return total, doc_counts

        try:
            self._execute_with_fallback(_do_scroll)
        except Exception as e:
            logger.warning("Notice on retrieving memory stats for user %s: %s", user_id, e)

        return MemoryStatsResponse(
            user_id=user_id_str,
            total_chunks=total,
            doc_type_breakdown=doc_counts,
            collection_name=self.collection_name,
            status="active" if total > 0 else "empty",
        )


memory_service = MemoryService()
