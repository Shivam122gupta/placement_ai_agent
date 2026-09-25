import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field


class AgentToolCallDocument(Document):
    user_id: PydanticObjectId
    session_id: str
    tool_name: str
    input_payload: Dict[str, Any] = Field(default_factory=dict)
    output_payload: Dict[str, Any] = Field(default_factory=dict)
    latency_ms: float = 0.0
    is_error: bool = False
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "agent_tool_calls"
        indexes = [
            "session_id",
            "user_id",
            "tool_name",
        ]


class AgentRunDocument(Document):
    user_id: PydanticObjectId
    session_id: str
    initial_prompt: str
    status: str = "COMPLETED"  # "COMPLETED" | "WAITING_CONFIRMATION" | "FAILED"
    total_steps: int = 1
    total_latency_ms: float = 0.0
    tool_calls: List[str] = Field(default_factory=list)  # List of tool names called
    final_response: str = ""
    pending_action: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "agent_runs"
        indexes = [
            "session_id",
            "user_id",
            "created_at",
        ]
