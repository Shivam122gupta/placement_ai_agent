import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_health_get(async_client: AsyncClient):
    """Verifies that GET /health returns HTTP 200 with status: healthy."""
    response = await async_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "healthy"


@pytest.mark.asyncio
async def test_root_health_head(async_client: AsyncClient):
    """Verifies that HEAD /health (used by uptime monitors) returns HTTP 200."""
    response = await async_client.head("/health")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_api_v1_health_get(async_client: AsyncClient):
    """Verifies that GET /api/v1/health returns HTTP 200 with status: healthy."""
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "healthy"
