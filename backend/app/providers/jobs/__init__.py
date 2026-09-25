from app.core.config import settings
from app.providers.jobs.base import BaseJobProvider, RawJobItem
from app.providers.jobs.mock_job_provider import MockJobProvider


def get_job_provider() -> BaseJobProvider:
    # Pluggable factory returning configured job provider
    return MockJobProvider()


__all__ = ["BaseJobProvider", "RawJobItem", "MockJobProvider", "get_job_provider"]
