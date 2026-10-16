import pytest
from httpx import AsyncClient
from beanie import init_beanie

from app.main import app
from app.core.rate_limiter import rate_limiter
from app.core.traffic_monitor import scraper_tracker


@pytest.mark.asyncio
async def test_bot_user_agent_detection(async_client: AsyncClient):
    """
    Verifies that automated scrapers, exploit tools, and headless bots
    are detected and blocked with HTTP 403 BOT_ACCESS_DENIED.
    """
    bad_user_agents = [
        "curl/7.68.0",
        "python-requests/2.31.0",
        "Scrapy/2.11.0 (+https://scrapy.org)",
        "sqlmap/1.7#stable",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36",
    ]

    for ua in bad_user_agents:
        res = await async_client.get(
            "/api/v1/jobs",
            headers={"User-Agent": ua, "X-Test-Bot-Block": "true"},
        )
        assert res.status_code == 403, f"Expected 403 for User-Agent: {ua}, got {res.status_code}"
        data = res.json()
        assert data["error"]["code"] == "BOT_ACCESS_DENIED"


@pytest.mark.asyncio
async def test_honeypot_registration_protection(async_client: AsyncClient):
    """
    Verifies that automated bots filling the hidden honeypot field
    are rejected immediately with HTTP 400.
    """
    bot_payload = {
        "email": "bot_spammer@example.com",
        "password": "StrongPassword123!",
        "full_name": "Spam Bot",
        "website": "https://malicious-spam-domain.com",  # Honeypot filled by bot
    }

    res = await async_client.post("/api/v1/auth/register", json=bot_payload)
    assert res.status_code == 400
    err_body = res.json()
    err_msg = err_body.get("error", {}).get("message", "") or err_body.get("detail", "")
    assert "bot protection filter" in err_msg


@pytest.mark.asyncio
async def test_anti_scraping_burst_protection(async_client: AsyncClient, auth_headers: dict):
    """
    Verifies that burst scraping on data listing endpoints is throttled with HTTP 429 DATA_SCRAPING_DETECTED.
    """
    # Trigger burst scraping threshold (12 requests)
    for _ in range(12):
        scraper_tracker.is_burst_scraping("127.0.0.1")

    res = await async_client.get(
        "/api/v1/jobs",
        headers={**auth_headers, "X-Test-Scraper-Check": "true"},
    )
    assert res.status_code == 429
    data = res.json()
    assert data["error"]["code"] == "DATA_SCRAPING_DETECTED"
    assert "Retry-After" in res.headers


@pytest.mark.asyncio
async def test_pagination_offset_limit_anti_scraping(async_client: AsyncClient, auth_headers: dict):
    """
    Verifies that scrapers cannot request extreme pagination offsets to dump the entire database.
    Query validation enforces le=1000, returning HTTP 422 Unprocessable Entity.
    """
    res = await async_client.get(
        "/api/v1/jobs?skip=1001&limit=20",
        headers=auth_headers,
    )
    assert res.status_code in (400, 422)


@pytest.mark.asyncio
async def test_rate_limiting_on_login_attempts(async_client: AsyncClient):
    """
    Verifies that repeated login attempts from the same IP trigger rate limiting (HTTP 429).
    """
    rate_limiter._store.clear()

    # Login limit is 5 attempts / min
    for i in range(5):
        res = await async_client.post(
            "/api/v1/auth/login",
            json={"email": f"user{i}@test.com", "password": "WrongPassword123!"},
            headers={"X-Test-Rate-Limit": "true"},
        )
        # First 5 attempts reach auth service (returning 401 or 400)
        assert res.status_code in (400, 401, 404)

    # 6th attempt should be blocked by rate limiter
    res_blocked = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "victim@test.com", "password": "WrongPassword123!"},
        headers={"X-Test-Rate-Limit": "true"},
    )
    assert res_blocked.status_code == 429
    data = res_blocked.json()
    assert data["error"]["code"] == "RATE_LIMIT_EXCEEDED"
    assert "Retry-After" in res_blocked.headers


@pytest.mark.asyncio
async def test_rate_limiting_on_ai_generation_requests(async_client: AsyncClient, auth_headers: dict):
    """
    Verifies that AI generation endpoints are specifically protected with HTTP 429 AI_RATE_LIMIT_EXCEEDED.
    """
    rate_limiter._store.clear()

    # /api/v1/interviews/generate has a strict limit of 5 requests / 5 min
    gen_payload = {
        "job_id": None,
        "target_role": "Backend Engineer",
        "experience_level": "intermediate",
        "title": "Backend Mock Interview",
    }

    # Simulate hitting the limit
    for _ in range(5):
        await async_client.post(
            "/api/v1/interviews/generate",
            json=gen_payload,
            headers={**auth_headers, "X-Test-Rate-Limit": "true"},
        )

    # 6th attempt must trigger AI rate limit
    res_blocked = await async_client.post(
        "/api/v1/interviews/generate",
        json=gen_payload,
        headers={**auth_headers, "X-Test-Rate-Limit": "true"},
    )
    assert res_blocked.status_code == 429
    data = res_blocked.json()
    assert data["error"]["code"] == "AI_RATE_LIMIT_EXCEEDED"
    assert "AI generation limit reached" in data["error"]["message"]
