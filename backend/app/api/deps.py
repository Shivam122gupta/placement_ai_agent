from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from beanie import PydanticObjectId
from app.core.security import decode_access_token
from app.core.token_blacklist import is_blacklisted
from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.core.config import settings
from app.models.user import UserDocument

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)) -> UserDocument:
    if not credentials or not credentials.credentials:
        raise AuthenticationError("Authentication credentials were not provided", code="NOT_AUTHENTICATED")

    token = credentials.credentials

    # 1. Blacklist check — immediately reject revoked access tokens
    if is_blacklisted(token):
        raise AuthenticationError("Access token has been revoked. Please login again.", code="TOKEN_REVOKED")

    try:
        payload = decode_access_token(token)
        if payload.get("type") != "access":
            raise AuthenticationError("Invalid token type", code="INVALID_TOKEN_TYPE")
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Could not validate credentials", code="INVALID_TOKEN_PAYLOAD")
    except Exception:
        raise AuthenticationError("Access token is invalid or has expired", code="ACCESS_TOKEN_EXPIRED")

    try:
        obj_id = PydanticObjectId(user_id)
    except Exception:
        raise AuthenticationError("Malformed user identifier in token", code="MALFORMED_TOKEN_SUBJECT")

    user = await UserDocument.get(obj_id)
    if not user:
        raise AuthenticationError("User not found", code="USER_NOT_FOUND")

    # 2. Session invalidation check — ensure token matches user's current token_version
    token_ver = payload.get("ver")
    if token_ver is not None and token_ver != getattr(user, "token_version", 1):
        raise AuthenticationError("Session has been invalidated due to password change or logout. Please sign in again.", code="SESSION_INVALIDATED")

    # 3. Check account activation
    if not user.is_active:
        raise PermissionDeniedError("Your account is currently inactive. Please contact support.", code="ACCOUNT_INACTIVE")

    def _ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
        if dt is None:
            return None
        return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt

    # 4. Check for session inactivity timeout
    now = datetime.now(timezone.utc)
    inactivity_limit = settings.SESSION_INACTIVITY_TIMEOUT_MINUTES
    cutoff = now - timedelta(minutes=inactivity_limit)
    last_active = _ensure_utc(user.last_active_at)

    if last_active and last_active < cutoff:
        user.is_online = False
        user.last_logout_at = now
        user.update_timestamp()
        await user.save()
        raise AuthenticationError(f"Session expired after {inactivity_limit} minutes of inactivity. Please login again.", code="SESSION_EXPIRED")

    # Refresh last_active_at & is_online (throttled to max once every 60 seconds)
    if not last_active or (now - last_active).total_seconds() > 60 or not user.is_online:
        user.last_active_at = now
        user.is_online = True
        user.update_timestamp()
        await user.save()

    return user


async def get_current_active_user(current_user: UserDocument = Depends(get_current_user)) -> UserDocument:
    if not current_user.is_active:
        raise PermissionDeniedError("Your account is currently inactive. Please contact support.", code="ACCOUNT_INACTIVE")
    return current_user


async def get_current_verified_user(current_user: UserDocument = Depends(get_current_active_user)) -> UserDocument:
    if settings.REQUIRE_EMAIL_VERIFICATION and not current_user.is_verified:
        raise PermissionDeniedError("Email address must be verified to perform this action.", code="EMAIL_NOT_VERIFIED")
    return current_user


async def get_current_admin_user(current_user: UserDocument = Depends(get_current_active_user)) -> UserDocument:
    if getattr(current_user, "role", "user") != "admin":
        raise PermissionDeniedError("Administrator privileges are required to access this resource.", code="ADMIN_REQUIRED")
    return current_user
