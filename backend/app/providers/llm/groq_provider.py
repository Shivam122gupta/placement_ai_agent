import logging
from typing import Optional
from groq import AsyncGroq
from app.providers.llm.base import BaseLLMProvider
from app.core.config import settings
from app.core.exceptions import AppException

logger = logging.getLogger("app.llm.groq")


class GroqProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = model or settings.GROQ_MODEL
        if not self.api_key:
            logger.warning("Groq API key not set. Calls will fail unless mock provider is used.")
        self.client = AsyncGroq(api_key=self.api_key) if self.api_key else None

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.1) -> str:
        if not self.client:
            raise AppException(
                status_code=500,
                code="LLM_NOT_CONFIGURED",
                message="Groq API key is not configured in .env",
            )

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            chat_completion = await self.client.chat.completions.create(
                messages=messages,
                model=self.model,
                temperature=temperature,
                response_format={"type": "json_object"} if "json" in prompt.lower() else None,
            )
            return chat_completion.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"Groq API call failed: {e}")
            raise AppException(
                status_code=502,
                code="LLM_PROVIDER_ERROR",
                message=f"AI model provider failed: {str(e)}",
            )
