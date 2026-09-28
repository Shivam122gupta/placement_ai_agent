from typing import Optional
from fastapi import Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from beanie import PydanticObjectId
from app.core.security import decode_access_token
from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.models.user import UserDocument

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)) -> UserDocument:
    if not credentials or not credentials.credentials:
        raise AuthenticationError("Authentication credentials were not provided", code="NOT_AUTHENTICATED")

    token = credentials.credentials
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

    return user


async def get_current_active_user(current_user: UserDocument = Depends(get_current_user)) -> UserDocument:
    if not current_user.is_active:
        raise PermissionDeniedError("Your account is currently inactive. Please contact support.", code="ACCOUNT_INACTIVE")
    return current_user


async def get_current_admin_user(current_user: UserDocument = Depends(get_current_active_user)) -> UserDocument:
    if getattr(current_user, "role", "user") != "admin":
        raise PermissionDeniedError("Administrator privileges are required to access this resource.", code="ADMIN_REQUIRED")
    return current_user
