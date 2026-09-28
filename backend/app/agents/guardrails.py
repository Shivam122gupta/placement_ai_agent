import logging
from typing import List, Dict, Any

logger = logging.getLogger("app.agents.guardrails")

MAX_AGENT_STEPS = 10
MAX_SESSION_TOOL_CALLS = 15


class SafetyViolationError(Exception):
    pass


class SafetyGuardrails:
    @staticmethod
    def check_step_limit(current_step: int, max_steps: int = MAX_AGENT_STEPS) -> None:
        if current_step >= max_steps:
            logger.warning(f"Agent exceeded maximum step ceiling of {max_steps}. Terminating loop.")
            raise SafetyViolationError(
                f"Agent step limit reached ({max_steps} steps). Terminating execution to prevent infinite loops."
            )

    @staticmethod
    def detect_repetitive_loop(tool_history: List[Dict[str, Any]]) -> None:
        """
        Detects if the agent is calling the same tool with identical arguments 3 times consecutively.
        """
        if len(tool_history) < 3:
            return

        last_three = tool_history[-3:]
        names = [call.get("tool_name") for call in last_three]
        params = [str(call.get("params")) for call in last_three]

        if len(set(names)) == 1 and len(set(params)) == 1:
            logger.warning(f"Detected repetitive loop with tool '{names[0]}'. Breaking loop.")
            raise SafetyViolationError(
                f"Loop breaker triggered: Consecutive identical calls detected for tool '{names[0]}'."
            )

    @staticmethod
    def sanitize_output(text: str) -> str:
        """Sanitizes output against prompt leaks, raw token dump, and ugly raw markdown syntax."""
        if not text:
            return ""
        sanitized = text.replace("SYSTEM_PROMPT:", "").strip()
        # Remove bold asterisks (e.g. **word** -> word)
        sanitized = sanitized.replace("**", "")
        # Remove markdown heading hashes at line starts (e.g. ### Title -> Title)
        lines = []
        for line in sanitized.split("\n"):
            stripped = line.lstrip()
            if stripped.startswith("#"):
                # Remove leading hashes and space
                line = stripped.lstrip("#").strip()
            # Replace bullet asterisks (* item -> - item)
            elif stripped.startswith("* "):
                line = "- " + stripped[2:]
            lines.append(line)
        return "\n".join(lines).strip()
