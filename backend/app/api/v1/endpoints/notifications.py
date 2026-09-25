import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.models.user import UserDocument
from app.api.deps import get_current_user
from app.services.notification_service import notification_service
from app.schemas.notification import NotificationResponse

logger = logging.getLogger("app.api.notifications")
router = APIRouter()


@router.get("", response_model=List[NotificationResponse], summary="List user notifications")
async def list_notifications(
    unread_only: bool = Query(False, description="Filter only unread notifications"),
    current_user: UserDocument = Depends(get_current_user),
):
    docs = await notification_service.get_user_notifications(
        user_id=str(current_user.id),
        unread_only=unread_only,
    )
    return [
        NotificationResponse(
            id=str(d.id),
            user_id=str(d.user_id),
            title=d.title,
            message=d.message,
            type=d.type,
            is_read=d.is_read,
            link_url=d.link_url,
            created_at=d.created_at.isoformat() if d.created_at else "",
        )
        for d in docs
    ]


@router.patch("/{notification_id}/read", response_model=NotificationResponse, summary="Mark notification as read")
async def mark_notification_read(
    notification_id: str,
    current_user: UserDocument = Depends(get_current_user),
):
    doc = await notification_service.mark_as_read(
        user_id=str(current_user.id),
        notification_id=notification_id,
    )
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
    return NotificationResponse(
        id=str(doc.id),
        user_id=str(doc.user_id),
        title=doc.title,
        message=doc.message,
        type=doc.type,
        is_read=doc.is_read,
        link_url=doc.link_url,
        created_at=doc.created_at.isoformat() if doc.created_at else "",
    )


@router.patch("/read-all", summary="Mark all notifications as read")
async def mark_all_notifications_read(
    current_user: UserDocument = Depends(get_current_user),
):
    count = await notification_service.mark_all_as_read(user_id=str(current_user.id))
    return {"success": True, "marked_count": count}
