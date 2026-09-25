import json
import re
from abc import ABC, abstractmethod
from typing import Type, TypeVar, Optional, Dict, Any
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.1) -> str:
        """Generate raw text response from the model."""
        pass

    async def generate_structured_output(
        self,
        schema: Type[T],
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.0,
    ) -> T:
        """
        Sends prompt to LLM and parses JSON output into target Pydantic schema with auto-repair.
        """
        schema_json = json.dumps(schema.model_json_schema(), indent=2)
        json_prompt = (
            f"{prompt}\n\n"
            f"Target JSON Schema:\n```json\n{schema_json}\n```\n\n"
            "CRITICAL: Respond ONLY with valid, unescaped JSON matching this exact JSON schema. "
            "Do NOT include markdown backticks (```json), commentary, or extra text before or after the JSON."
        )
        
        raw_text = await self.generate_text(prompt=json_prompt, system_prompt=system_prompt, temperature=temperature)
        cleaned_json_str = self._extract_json_string(raw_text)
        
        try:
            data = json.loads(cleaned_json_str)
            return schema.model_validate(data)
        except Exception as e:
            # Secondary cleanup attempt
            data = self._repair_and_parse_json(cleaned_json_str)
            return schema.model_validate(data)

    @staticmethod
    def _extract_json_string(text: str) -> str:
        text = text.strip()
        # Remove ```json ... ``` code blocks if model included them
        if "```json" in text:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
            if match:
                return match.group(1).strip()
        elif "```" in text:
            match = re.search(r"```\s*([\s\S]*?)\s*```", text)
            if match:
                return match.group(1).strip()

        # Find first { and last }
        first_brace = text.find("{")
        last_brace = text.rfind("}")
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            return text[first_brace : last_brace + 1]
        return text

    @staticmethod
    def _repair_and_parse_json(text: str) -> Dict[str, Any]:
        # Basic cleanup of trailing commas before closing braces/brackets
        repaired = re.sub(r",\s*([\]}])", r"\1", text)
        return json.loads(repaired)
