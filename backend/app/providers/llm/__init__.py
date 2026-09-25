from app.core.config import settings
from app.providers.llm.base import BaseLLMProvider
from app.providers.llm.groq_provider import GroqProvider
from app.providers.llm.mock_provider import MockLLMProvider


def get_llm_provider() -> BaseLLMProvider:
    provider_name = settings.LLM_PROVIDER.lower()
    
    if provider_name == "groq" and settings.GROQ_API_KEY:
        return GroqProvider()
    elif provider_name == "mock" or not settings.GROQ_API_KEY:
        return MockLLMProvider()
    
    return GroqProvider()


__all__ = ["BaseLLMProvider", "GroqProvider", "MockLLMProvider", "get_llm_provider"]
