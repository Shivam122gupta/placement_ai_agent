import asyncio
from datetime import datetime, timezone, timedelta
import logging
from app.models.user import UserDocument
from app.services.admin_ws_service import admin_ws_manager

logger = logging.getLogger(__name__)

SESSION_TIMEOUT_MINUTES = 60


async def cleanup_inactive_sessions() -> int:
    """
    Finds users marked as online whose last_active_at (or last_login_at) is older than 60 minutes,
    marks them as offline, and broadcasts USER_LOGOUT websocket events.
    Returns the count of users cleaned up.
    """
    try:
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(minutes=SESSION_TIMEOUT_MINUTES)
        
        online_users = await UserDocument.find(UserDocument.is_online == True).to_list()  # noqa: E712
        cleaned_count = 0
        
        for user in online_users:
            last_active = user.last_active_at or user.last_login_at
            if last_active and last_active.tzinfo is None:
                last_active = last_active.replace(tzinfo=timezone.utc)
            if not last_active or last_active < cutoff:
                user.is_online = False
                user.last_logout_at = now
                user.update_timestamp()
                await user.save()
                cleaned_count += 1
                
                try:
                    await admin_ws_manager.broadcast("USER_LOGOUT", {
                        "user_id": str(user.id),
                        "email": user.email,
                        "reason": "auto_timeout_60m",
                        "timestamp": now.isoformat()
                    })
                except Exception as err:
                    logger.warning(f"Failed to broadcast auto USER_LOGOUT event for {user.email}: {err}")

        if cleaned_count > 0:
            logger.info(f"Auto-logout: Cleaned up {cleaned_count} inactive user session(s).")
        return cleaned_count
    except Exception as e:
        logger.error(f"Error during inactive session cleanup: {e}")
        return 0


async def start_periodic_session_cleanup(interval_seconds: int = 300):
    """
    Background loop that runs inactive session cleanup periodically.
    Default interval is 5 minutes (300 seconds).
    """
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            await cleanup_inactive_sessions()
        except asyncio.CancelledError:
            logger.info("Periodic session cleanup task cancelled.")
            break
        except Exception as e:
            logger.error(f"Unexpected error in periodic session cleanup loop: {e}")
