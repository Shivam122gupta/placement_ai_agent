import logging
from typing import List
from fastapi import APIRouter, Depends

from app.schemas.agent import (
    AgentChatRequest,
    AgentChatResponse,
    ActionConfirmationRequest,
    AgentHistoryItem,
)
from app.schemas.common import StandardResponse
from app.agents.orchestrator import AgentOrchestrator
from app.models.agent_trace import AgentRunDocument
from app.api.deps import get_current_user
from app.models.user import UserDocument

router = APIRouter()
logger = logging.getLogger("app.api.agent")


@router.post("/chat", response_model=StandardResponse[AgentChatResponse])
async def agent_chat(
    payload: AgentChatRequest,
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Interacts with the AI Placement Agent Copilot.
    The agent autonomously reasons, calls tools, executes safety guardrails, and responds.
    """
    state = await AgentOrchestrator.process_prompt(
        user_id=current_user.id,
        user_prompt=payload.message,
        session_id=payload.session_id,
    )

    response_data = AgentChatResponse(
        session_id=state.session_id,
        status=state.status,
        response=state.final_response or "I am analyzing your profile and job preferences.",
        tool_audits=state.tool_audits,
        pending_confirmation=state.pending_confirmation,
        step_count=state.current_step,
    )

    return StandardResponse(
        success=True,
        message="Agent response generated",
        data=response_data,
    )


@router.post("/confirm-action", response_model=StandardResponse[AgentChatResponse])
async def confirm_agent_action(
    payload: ActionConfirmationRequest,
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Submits user approval or rejection for a pending Human-in-the-Loop action.
    """
    state = await AgentOrchestrator.confirm_and_resume(
        user_id=current_user.id,
        session_id=payload.session_id,
        tool_name=payload.tool_name,
        params=payload.params,
        decision=payload.decision,
    )

    response_data = AgentChatResponse(
        session_id=state.session_id,
        status=state.status,
        response=state.final_response or "Action processed.",
        tool_audits=state.tool_audits,
        pending_confirmation=None,
        step_count=1,
    )

    return StandardResponse(
        success=True,
        message="Action confirmed and executed",
        data=response_data,
    )


@router.get("/history", response_model=StandardResponse[List[AgentHistoryItem]])
async def get_agent_history(
    current_user: UserDocument = Depends(get_current_user),
):
    """
    Fetches recent agent conversation sessions and execution audit runs.
    """
    runs = await AgentRunDocument.find(
        AgentRunDocument.user_id == current_user.id
    ).sort("-created_at").limit(20).to_list()

    history_items = [
        AgentHistoryItem(
            id=str(r.id),
            session_id=r.session_id,
            initial_prompt=r.initial_prompt,
            status=r.status,
            total_steps=r.total_steps,
            total_latency_ms=r.total_latency_ms,
            tool_calls=r.tool_calls,
            final_response=r.final_response,
            created_at=r.created_at.isoformat(),
        )
        for r in runs
    ]

    return StandardResponse(
        success=True,
        message="Agent history retrieved",
        data=history_items,
    )
