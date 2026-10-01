import logging
from typing import List, Optional
from datetime import datetime, timezone
from beanie import PydanticObjectId

from app.models.notification import NotificationDocument
from app.schemas.notification import NotificationCreate

logger = logging.getLogger("app.notifications")


class NotificationService:
    async def create_notification(
        self,
        user_id: str,
        payload: NotificationCreate,
    ) -> NotificationDocument:
        """Creates and saves a new in-app notification for the user."""
        p_user_id = PydanticObjectId(user_id)
        doc = NotificationDocument(
            user_id=p_user_id,
            title=payload.title,
            message=payload.message,
            type=payload.type,
            link_url=payload.link_url,
            is_read=False,
            created_at=datetime.now(timezone.utc),
        )
        await doc.insert()
        logger.info("Created notification %s for user %s: %s", doc.id, user_id, doc.title)
        return doc

    async def get_user_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50,
    ) -> List[NotificationDocument]:
        """Fetches notifications for a candidate."""
        p_user_id = PydanticObjectId(user_id)
        query = [NotificationDocument.user_id == p_user_id]
        if unread_only:
            query.append(NotificationDocument.is_read == False)  # noqa: E712

        return await NotificationDocument.find(*query).sort(-NotificationDocument.created_at).limit(limit).to_list()

    async def mark_as_read(self, user_id: str, notification_id: str) -> Optional[NotificationDocument]:
        """Marks a single notification as read."""
        p_user_id = PydanticObjectId(user_id)
        p_notif_id = PydanticObjectId(notification_id)
        doc = await NotificationDocument.find_one(
            NotificationDocument.id == p_notif_id,
            NotificationDocument.user_id == p_user_id,
        )
        if doc:
            doc.is_read = True
            await doc.save()
            return doc
        return None

    async def mark_all_as_read(self, user_id: str) -> int:
        """Marks all unread notifications as read for the user in a single atomic bulk operation."""
        p_user_id = PydanticObjectId(user_id)
        result = await NotificationDocument.find(
            NotificationDocument.user_id == p_user_id,
            NotificationDocument.is_read == False,  # noqa: E712
        ).update({"$set": {"is_read": True}})

        return result.modified_count if result else 0


notification_service = NotificationService()
