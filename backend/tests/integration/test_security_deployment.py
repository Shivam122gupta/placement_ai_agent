import pytest
from httpx import AsyncClient
from app.core.config import settings
from app.core.security_logger import security_logger, SecurityEventType
from app.models.user import UserDocument
from app.core.security import get_password_hash


@pytest.mark.asyncio
async def test_security_headers_present(async_client: AsyncClient):
    """Verifies that enterprise HTTP security headers and HSTS are attached to responses."""
    res = await async_client.get("/health")
    assert res.status_code == 200

    headers = res.headers
    # Strict-Transport-Security (HSTS)
    assert "strict-transport-security" in headers
    assert "max-age=31536000" in headers["strict-transport-security"]
    assert "includeSubDomains" in headers["strict-transport-security"]

    # Security Headers
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") in ["SAMEORIGIN", "DENY"]
    assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "camera=()" in headers.get("permissions-policy", "")


@pytest.mark.asyncio
async def test_traffic_monitor_blocks_path_traversal(async_client: AsyncClient):
    """Verifies that path traversal attempts are detected and blocked with 403."""
    traversal_urls = [
        "/api/v1/..%2f..%2fetc/passwd",
        "/api/v1/resumes/../../.env",
        "/api/v1/.git/config",
        "/phpmyadmin/index.php",
        "/cgi-bin/test.cgi",
        "/actuator/env",
    ]
    for url in traversal_urls:
        res = await async_client.get(url)
        assert res.status_code == 403
        data = res.json()
        assert data["error"]["code"] == "SUSPICIOUS_REQUEST_BLOCKED"


@pytest.mark.asyncio
async def test_traffic_monitor_blocks_malicious_query_payloads(async_client: AsyncClient):
    """Verifies that SQLi and script injection attempts in query strings are blocked with 400."""
    malicious_queries = [
        "/api/v1/jobs?query=1%20union%20select%20null,null",
        "/api/v1/jobs?search=%3Cscript%3Ealert(document.cookie)%3C/script%3E",
        "/api/v1/applications?notes=javascript:alert(1)",
    ]
    for url in malicious_queries:
        res = await async_client.get(url)
        assert res.status_code == 400
        data = res.json()
        assert data["error"]["code"] == "MALICIOUS_PAYLOAD_DETECTED"


@pytest.mark.asyncio
async def test_security_logging_on_auth_attempts(async_client: AsyncClient, mock_db):
    """Verifies that authentication successes and failures record structured security events."""
    # Seed test user
    email = "audit_user@example.com"
    pwd = "SecurePassword123!"
    user = UserDocument(
        email=email,
        hashed_password=get_password_hash(pwd),
        is_active=True,
        is_verified=True,
        failed_login_attempts=0,
    )
    await user.insert()

    # Track logged events via monkeypatch or inspection
    logged_events = []
    original_log = security_logger.log_event

    def mock_log_event(event_type, **kwargs):
        logged_events.append({"event_type": event_type, **kwargs})
        return original_log(event_type, **kwargs)

    security_logger.log_event = mock_log_event

    try:
        # 1. Invalid password attempt -> must log AUTH_LOGIN_FAILED
        res_fail = await async_client.post("/api/v1/auth/login", json={"email": email, "password": "WrongPassword!"})
        assert res_fail.status_code == 401
        failed_events = [e for e in logged_events if e["event_type"] == SecurityEventType.AUTH_LOGIN_FAILED]
        assert len(failed_events) >= 1
        assert failed_events[-1]["email"] == email

        # 2. Valid password attempt -> must log AUTH_LOGIN_SUCCESS
        res_ok = await async_client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
        assert res_ok.status_code == 200
        success_events = [e for e in logged_events if e["event_type"] == SecurityEventType.AUTH_LOGIN_SUCCESS]
        assert len(success_events) >= 1
        assert success_events[-1]["email"] == email

    finally:
        security_logger.log_event = original_log


@pytest.mark.asyncio
async def test_api_access_denied_security_logging(async_client: AsyncClient):
    """Verifies that accessing protected endpoints without credentials triggers API_ACCESS_DENIED."""
    logged_events = []
    original_log = security_logger.log_event

    def mock_log_event(event_type, **kwargs):
        logged_events.append({"event_type": event_type, **kwargs})
        return original_log(event_type, **kwargs)

    security_logger.log_event = mock_log_event

    try:
        res = await async_client.get("/api/v1/profile")
        assert res.status_code == 401
        access_denied_events = [e for e in logged_events if e["event_type"] == SecurityEventType.API_ACCESS_DENIED]
        assert len(access_denied_events) >= 1
    finally:
        security_logger.log_event = original_log
