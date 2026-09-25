from typing import List, Dict, Any, Optional
from beanie import PydanticObjectId
from pydantic import BaseModel, Field


class ToolCallAudit(BaseModel):
    tool_name: str
    params: Dict[str, Any] = Field(default_factory=dict)
    result_summary: str = ""
    is_error: bool = False
    latency_ms: float = 0.0


class PendingConfirmation(BaseModel):
    confirmation_token: str
    tool_name: str
    params: Dict[str, Any]
    warning_message: str


class AgentState(BaseModel):
    session_id: str
    user_id: PydanticObjectId
    current_step: int = 0
    max_steps: int = 10
    messages: List[Dict[str, str]] = Field(default_factory=list)
    tool_history: List[Dict[str, Any]] = Field(default_factory=list)
    tool_audits: List[ToolCallAudit] = Field(default_factory=list)
    pending_confirmation: Optional[PendingConfirmation] = None
    final_response: Optional[str] = None
    status: str = "RUNNING"  # "RUNNING" | "WAITING_CONFIRMATION" | "COMPLETED" | "FAILED"
