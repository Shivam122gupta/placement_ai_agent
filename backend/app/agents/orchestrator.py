import json
import uuid
import time
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from beanie import PydanticObjectId
from pydantic import BaseModel, Field

from app.agents.state import AgentState, ToolCallAudit, PendingConfirmation
from app.agents.guardrails import SafetyGuardrails, SafetyViolationError
from app.tools.registry import tool_registry
from app.tools.base import ToolExecutionContext
from app.models.agent_trace import AgentRunDocument, AgentToolCallDocument
from app.providers.llm import get_llm_provider

logger = logging.getLogger("app.agents.orchestrator")


class LLMPlanStep(BaseModel):
    action_type: str = Field(..., description="'CALL_TOOL' or 'FINAL_RESPONSE'")
    tool_name: Optional[str] = Field(default=None, description="Name of tool to execute")
    tool_params: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Parameters dictionary")
    final_answer: Optional[str] = Field(default=None, description="Complete, natural, and helpful plain response to the user")
    thought: Optional[str] = Field(default=None, description="Internal reasoning step")


class AgentOrchestrator:
    @classmethod
    async def process_prompt(
        cls,
        user_id: PydanticObjectId,
        user_prompt: str,
        session_id: Optional[str] = None,
        max_steps: int = 10,
    ) -> AgentState:
        session = session_id or str(uuid.uuid4())
        state = AgentState(
            session_id=session,
            user_id=user_id,
            max_steps=max_steps,
            messages=[{"role": "user", "content": user_prompt}],
        )

        tools_prompt_spec = tool_registry.get_tools_description_prompt()
        system_prompt = (
            "You are the Hirxora AI Career Copilot — a friendly, expert, and articulate career and placement advisor.\n"
            "Your goal is to actively assist students and candidates by analyzing their profiles, finding target jobs, "
            "evaluating match fit, bridging skill gaps with study roadmaps, and guiding career applications.\n\n"
            "AVAILABLE TOOLS:\n"
            f"{tools_prompt_spec}\n\n"
            "REASONING & EXECUTION PROTOCOL:\n"
            "1. Plan your steps carefully. If you need information, call the appropriate tool.\n"
            "2. When calling a tool, specify action_type='CALL_TOOL', tool_name, and valid tool_params.\n"
            "3. Once you have gathered sufficient information to answer the candidate completely, specify action_type='FINAL_RESPONSE' "
            "and provide a clear, conversational, and beautifully formatted response in final_answer.\n"
            "4. IMPORTANT FORMATTING RULES FOR final_answer:\n"
            "   - Write in natural, easy-to-read human text.\n"
            "   - DO NOT overuse markdown asterisks (no **bold** stars or *italic* stars).\n"
            "   - DO NOT use markdown heading hashes (no ### or ## headers).\n"
            "   - DO NOT mention raw internal tool names (like 'get_candidate_profile', 'search_jobs', etc.). Talk like a human career counselor.\n"
            "   - Use clean paragraphs, standard numbers (1., 2., 3.), or clean hyphens (-) for lists.\n"
            "5. NEVER fabricate facts or imagine tool outputs. Base all advice strictly on returned data."
        )

        start_time = time.time()
        tool_names_called: List[str] = []

        while state.current_step < state.max_steps:
            state.current_step += 1

            # 1. Guardrail checks
            try:
                SafetyGuardrails.check_step_limit(state.current_step, state.max_steps)
                SafetyGuardrails.detect_repetitive_loop(state.tool_history)
            except SafetyViolationError as e:
                logger.warning(f"Guardrail triggered: {e}")
                state.status = "COMPLETED"
                state.final_response = f"⚠️ {str(e)}\n\nHere is what I gathered for you so far based on executed steps."
                break

            # 2. Query LLM for next plan step
            conversation_history_text = cls._format_conversation_history(state.messages)
            llm = get_llm_provider()

            try:
                plan_step = await llm.generate_structured_output(
                    schema=LLMPlanStep,
                    prompt=conversation_history_text,
                    system_prompt=system_prompt,
                    temperature=0.1,
                )
            except Exception as e:
                logger.error(f"LLM orchestrator planning failed ({e}), falling back to deterministic response.")
                state.status = "COMPLETED"
                state.final_response = "I encountered an issue processing the next step. Let me know if you would like me to retry."
                break

            # 3. Handle Final Response
            if plan_step.action_type == "FINAL_RESPONSE" or not plan_step.tool_name:
                state.status = "COMPLETED"
                state.final_response = SafetyGuardrails.sanitize_output(plan_step.final_answer or "How else can I help your career?")
                break

            # 4. Handle Tool Execution
            tool = tool_registry.get_tool(plan_step.tool_name)
            if not tool:
                logger.warning(f"Tool '{plan_step.tool_name}' not found in registry.")
                state.messages.append({
                    "role": "system",
                    "content": f"Tool '{plan_step.tool_name}' does not exist. Please choose from available tools.",
                })
                continue

            tool_context = ToolExecutionContext(
                user_id=user_id,
                session_id=session,
                is_confirmed=False,
            )

            # Check if tool requires HITL confirmation
            if tool.requires_confirmation:
                token = str(uuid.uuid4())
                state.status = "WAITING_CONFIRMATION"
                state.pending_confirmation = PendingConfirmation(
                    confirmation_token=token,
                    tool_name=tool.name,
                    params=plan_step.tool_params or {},
                    warning_message=f"Please confirm: Do you want to execute '{tool.name}' with the specified parameters?",
                )
                state.final_response = f"I'm ready to proceed with **{tool.name}**, but this action requires your explicit confirmation."
                break

            # Execute Tool
            tool_res = await tool.run(raw_params=plan_step.tool_params or {}, context=tool_context)
            tool_names_called.append(tool.name)

            # Record in MongoDB Trace
            tool_call_doc = AgentToolCallDocument(
                user_id=user_id,
                session_id=session,
                tool_name=tool.name,
                input_payload=plan_step.tool_params or {},
                output_payload=tool_res.data or {},
                latency_ms=tool_res.latency_ms,
                is_error=not tool_res.success,
                error_message=tool_res.error,
            )
            await tool_call_doc.insert()

            # Record in state
            state.tool_history.append({
                "step": state.current_step,
                "tool_name": tool.name,
                "params": plan_step.tool_params,
                "success": tool_res.success,
            })

            summary = json.dumps(tool_res.data)[:200] if tool_res.data else (tool_res.error or "Executed")
            state.tool_audits.append(ToolCallAudit(
                tool_name=tool.name,
                params=plan_step.tool_params or {},
                result_summary=summary,
                is_error=not tool_res.success,
                latency_ms=tool_res.latency_ms,
            ))

            state.messages.append({
                "role": "tool",
                "content": f"Tool '{tool.name}' Output:\n{json.dumps(tool_res.data if tool_res.success else {'error': tool_res.error})}",
            })

        total_latency = (time.time() - start_time) * 1000
        # Persist AgentRunDocument
        run_doc = AgentRunDocument(
            user_id=user_id,
            session_id=session,
            initial_prompt=user_prompt,
            status=state.status,
            total_steps=state.current_step,
            total_latency_ms=total_latency,
            tool_calls=tool_names_called,
            final_response=state.final_response or "",
            pending_action=state.pending_confirmation.model_dump() if state.pending_confirmation else None,
        )
        await run_doc.insert()

        return state

    @classmethod
    async def confirm_and_resume(
        cls,
        user_id: PydanticObjectId,
        session_id: str,
        tool_name: str,
        params: Dict[str, Any],
        decision: str = "approve",  # "approve" | "reject"
    ) -> AgentState:
        state = AgentState(
            session_id=session_id,
            user_id=user_id,
            status="COMPLETED",
        )

        if decision.lower() != "approve":
            state.final_response = f"Action '{tool_name}' was cancelled per your request."
            return state

        tool = tool_registry.get_tool(tool_name)
        if not tool:
            state.status = "FAILED"
            state.final_response = f"Tool '{tool_name}' is no longer available."
            return state

        context = ToolExecutionContext(user_id=user_id, session_id=session_id, is_confirmed=True)
        tool_res = await tool.run(raw_params=params, context=context)

        tool_call_doc = AgentToolCallDocument(
            user_id=user_id,
            session_id=session_id,
            tool_name=tool.name,
            input_payload=params,
            output_payload=tool_res.data or {},
            latency_ms=tool_res.latency_ms,
            is_error=not tool_res.success,
            error_message=tool_res.error,
        )
        await tool_call_doc.insert()

        state.tool_audits.append(ToolCallAudit(
            tool_name=tool.name,
            params=params,
            result_summary="Action confirmed and executed successfully",
            is_error=not tool_res.success,
            latency_ms=tool_res.latency_ms,
        ))
        state.final_response = f"✅ Action **{tool.name}** was successfully approved and completed."
        return state

    @staticmethod
    def _format_conversation_history(messages: List[Dict[str, str]]) -> str:
        lines = []
        for msg in messages:
            role = msg.get("role", "user").upper()
            content = msg.get("content", "")
            lines.append(f"[{role}]:\n{content}\n")
        return "\n".join(lines)
