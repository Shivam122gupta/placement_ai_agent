from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.agents.state import ToolCallAudit, PendingConfirmation


class AgentChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000, description="Candidate prompt or question")
    session_id: Optional[str] = None


class AgentChatResponse(BaseModel):
    session_id: str
    status: str  # "COMPLETED" | "WAITING_CONFIRMATION" | "FAILED"
    response: str
    tool_audits: List[ToolCallAudit] = Field(default_factory=list)
    pending_confirmation: Optional[PendingConfirmation] = None
    step_count: int


class ActionConfirmationRequest(BaseModel):
    session_id: str
    tool_name: str
    params: Dict[str, Any]
    decision: str = Field(default="approve", description="'approve' or 'reject'")


class AgentHistoryItem(BaseModel):
    id: str
    session_id: str
    initial_prompt: str
    status: str
    total_steps: int
    total_latency_ms: float
    tool_calls: List[str]
    final_response: str
    created_at: str
