import logging
from typing import Optional
from groq import AsyncGroq
from app.providers.llm.base import BaseLLMProvider
from app.core.config import settings
from app.core.exceptions import AppException

logger = logging.getLogger("app.llm.groq")


FALLBACK_MODELS = [
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
]


class GroqProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = model or settings.GROQ_MODEL or "openai/gpt-oss-20b"
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

        models_to_try = [self.model] + [m for m in FALLBACK_MODELS if m != self.model]
        last_err = None

        for current_model in models_to_try:
            try:
                chat_completion = await self.client.chat.completions.create(
                    messages=messages,
                    model=current_model,
                    temperature=temperature,
                    response_format={"type": "json_object"} if "json" in prompt.lower() else None,
                )
                return chat_completion.choices[0].message.content or ""
            except Exception as e:
                last_err = e
                logger.warning(f"Groq API call failed for model '{current_model}': {e}. Attempting fallback...")

        logger.error(f"All Groq model attempts failed: {last_err}")
        raise AppException(
            status_code=502,
            code="LLM_PROVIDER_ERROR",
            message=f"AI model provider failed: {str(last_err)}",
        )
