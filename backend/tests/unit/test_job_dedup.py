import pytest
from app.services.job_service import JobService


def test_job_deduplication_hashing():
    # Minor differences in punctuation, corporate suffix, and spacing should yield identical hashes
    hash1 = JobService.compute_dedup_hash(
        company="Google LLC",
        title="Backend Developer (Python)",
        location="Bengaluru, India",
        source_url="https://google.com/jobs/123",
    )
    hash2 = JobService.compute_dedup_hash(
        company="Google Inc.",
        title="Backend Developer Python",
        location="Bengaluru, India",
        source_url="https://google.com/jobs/123",
    )
    assert hash1 == hash2

    # Different job title must yield a distinct hash
    hash3 = JobService.compute_dedup_hash(
        company="Google LLC",
        title="Frontend Developer (React)",
        location="Bengaluru, India",
        source_url="https://google.com/jobs/123",
    )
    assert hash1 != hash3


def test_canonicalize_string():
    assert JobService.canonicalize_string("  Amazon Technologies, Inc.  ") == "amazon"
    assert JobService.canonicalize_string("FastAPI / Python Backend Dev (Intern)") == "fastapi python backend dev intern"
