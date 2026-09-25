import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_notifications_lifecycle(async_client: AsyncClient, auth_headers: dict):
    # 1. Create an application (which automatically triggers a notification)
    app_res = await async_client.post("/api/v1/applications", json={
        "company_name": "Acme Global",
        "job_title": "Full Stack Dev",
        "status": "SAVED",
    }, headers=auth_headers)
    assert app_res.status_code == 201

    # 2. List notifications
    list_res = await async_client.get("/api/v1/notifications", headers=auth_headers)
    assert list_res.status_code == 200
    notifs = list_res.json()
    assert len(notifs) >= 1
    notif_id = notifs[0]["id"]
    assert notifs[0]["is_read"] is False

    # 3. Mark single notification as read
    read_res = await async_client.patch(f"/api/v1/notifications/{notif_id}/read", headers=auth_headers)
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] is True

    # 4. Mark all as read
    all_read_res = await async_client.patch("/api/v1/notifications/read-all", headers=auth_headers)
    assert all_read_res.status_code == 200
    assert all_read_res.json()["success"] is True

    # 5. Verify 0 unread notifications
    unread_res = await async_client.get("/api/v1/notifications?unread_only=true", headers=auth_headers)
    assert unread_res.status_code == 200
    assert len(unread_res.json()) == 0
