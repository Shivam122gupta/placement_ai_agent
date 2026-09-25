from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.tools.base import BaseTool, ToolExecutionContext
from app.services.memory_service import memory_service


class RetrieveCandidateContextInputSchema(BaseModel):
    query: str = Field(..., description="Natural language semantic search query (e.g. 'Kafka streaming microservices experience', 'leadership in university club')")
    doc_types: Optional[List[str]] = Field(
        default=None,
        description="Optional filter by document types: 'resume', 'profile_project', 'profile_experience', 'skills', 'candidate_note'"
    )
    top_k: int = Field(default=4, ge=1, le=10, description="Number of most relevant memory chunks to retrieve")


class RetrieveCandidateContextTool(BaseTool):
    name = "retrieve_candidate_context"
    description = (
        "Performs semantic vector search over the candidate's personal profile, resumes, technical projects, "
        "and work experiences to retrieve grounded factual context with zero hallucination."
    )
    input_schema = RetrieveCandidateContextInputSchema
    requires_confirmation = False

    async def execute(self, params: Dict[str, Any], context: ToolExecutionContext) -> Any:
        query = params.get("query", "")
        doc_types = params.get("doc_types")
        top_k = params.get("top_k", 4)

        results = memory_service.search_candidate_memory(
            user_id=context.user_id,
            query=query,
            doc_types=doc_types,
            top_k=top_k,
        )

        return [
            {
                "title": r.title,
                "section": r.section,
                "doc_type": r.doc_type,
                "content": r.content,
                "skills": r.skills,
                "relevance_score": round(r.score, 3),
            }
            for r in results
        ]
