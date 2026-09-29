import uuid
from datetime import datetime, timezone, timedelta
from typing import Tuple, Optional
from beanie import PydanticObjectId
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from app.core.exceptions import AuthenticationError, ConflictError, ResourceNotFoundError
from app.core.token_blacklist import blacklist_token, is_blacklisted
import logging
from app.models.user import UserDocument
from app.models.profile import ProfileDocument
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from app.core.config import settings
from app.services.email_service import EmailService

from app.services.admin_ws_service import admin_ws_manager

logger = logging.getLogger(__name__)


class AuthService:
    @staticmethod
    async def register(req: UserRegisterRequest) -> Tuple[UserResponse, TokenResponse]:
        # 1. Check if user already exists
        existing_user = await UserDocument.find_one(UserDocument.email == req.email.lower())
        if existing_user:
            raise ConflictError(f"User with email '{req.email}' already exists", code="EMAIL_ALREADY_EXISTS")

        # 2. Hash password & create user
        now = datetime.now(timezone.utc)
        hashed_password = get_password_hash(req.password)
        user = UserDocument(
            email=req.email.lower(),
            hashed_password=hashed_password,
            is_active=True,
            is_verified=False,
            is_online=True,
            last_login_at=now,
            last_active_at=now,
            verification_token=str(uuid.uuid4()),
        )
        await user.insert()

        # 3. Create initial empty profile
        profile = ProfileDocument(
            user_id=user.id,
            full_name=req.full_name or "",
            contact_email=req.email.lower(),
        )
        await profile.insert()

        # Send verification email asynchronously
        try:
            await EmailService.send_verification_email(user.email, user.verification_token, req.full_name)
        except Exception as e:
            logger.error(f"Failed to dispatch verification email during registration to {user.email}: {e}", exc_info=True)

        # Broadcast WebSocket event to Admin Panel
        try:
            await admin_ws_manager.broadcast("USER_REGISTERED", {
                "user_id": str(user.id),
                "email": user.email,
                "full_name": req.full_name or "",
                "timestamp": now.isoformat()
            })
        except Exception as err:
            logger.warning(f"Failed to broadcast USER_REGISTERED event: {err}")

        # 4. Generate JWT tokens
        access_token = create_access_token(subject=str(user.id))
        refresh_token = create_refresh_token(subject=str(user.id))

        user_resp = UserResponse(
            id=str(user.id),
            email=user.email,
            role=getattr(user, "role", "user"),
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at.isoformat(),
        )
        token_resp = TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
        return user_resp, token_resp

    @staticmethod
    async def login(req: UserLoginRequest) -> Tuple[UserResponse, TokenResponse]:
        user = await UserDocument.find_one(UserDocument.email == req.email.lower())
        if not user:
            raise AuthenticationError("Invalid email or password", code="INVALID_CREDENTIALS")

        if not verify_password(req.password, user.hashed_password):
            raise AuthenticationError("Invalid email or password", code="INVALID_CREDENTIALS")

        if not user.is_active:
            raise AuthenticationError("Your account has been deactivated. Please contact support.", code="ACCOUNT_INACTIVE")

        # Update user status & timestamps
        now = datetime.now(timezone.utc)
        user.is_online = True
        user.last_login_at = now
        user.last_active_at = now
        user.update_timestamp()
        await user.save()

        # Broadcast WebSocket event to Admin Panel
        try:
            await admin_ws_manager.broadcast("USER_LOGIN", {
                "user_id": str(user.id),
                "email": user.email,
                "role": user.role,
                "timestamp": now.isoformat()
            })
        except Exception as err:
            logger.warning(f"Failed to broadcast USER_LOGIN event: {err}")

        access_token = create_access_token(subject=str(user.id))
        refresh_token = create_refresh_token(subject=str(user.id))

        user_resp = UserResponse(
            id=str(user.id),
            email=user.email,
            role=getattr(user, "role", "user"),
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at.isoformat(),
        )
        token_resp = TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
        return user_resp, token_resp

    @staticmethod
    async def refresh_tokens(refresh_token: str) -> TokenResponse:
        # 0. Blacklist check — reject revoked tokens immediately
        if is_blacklisted(refresh_token):
            raise AuthenticationError("Refresh token has been revoked. Please login again.", code="TOKEN_REVOKED")

        try:
            payload = decode_refresh_token(refresh_token)
            if payload.get("type") != "refresh":
                raise AuthenticationError("Invalid token type", code="INVALID_TOKEN_TYPE")
            user_id = payload.get("sub")
            if not user_id:
                raise AuthenticationError("Invalid token payload", code="INVALID_TOKEN")
        except AuthenticationError:
            raise
        except Exception:
            raise AuthenticationError("Refresh token is expired or invalid", code="REFRESH_TOKEN_INVALID")

        user = await UserDocument.get(PydanticObjectId(user_id))
        if not user or not user.is_active:
            raise AuthenticationError("User not found or inactive", code="USER_INACTIVE")

        # Rotate: blacklist the old refresh token so it can't be reused
        try:
            exp = payload.get("exp", 0)
            remaining_ttl = max(1, int(exp - datetime.now(timezone.utc).timestamp()))
        except Exception:
            remaining_ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
        blacklist_token(refresh_token, remaining_ttl)

        new_access_token = create_access_token(subject=str(user.id))
        new_refresh_token = create_refresh_token(subject=str(user.id))

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    @staticmethod
    async def logout(refresh_token: str) -> None:
        """
        Revokes the provided refresh token so it cannot be used again,
        and marks user as offline in database.
        """
        if not refresh_token:
            return
        try:
            payload = decode_refresh_token(refresh_token)
            user_id = payload.get("sub")
            exp = payload.get("exp", 0)
            remaining_ttl = max(1, int(exp - datetime.now(timezone.utc).timestamp()))

            if user_id:
                user = await UserDocument.get(PydanticObjectId(user_id))
                if user:
                    now = datetime.now(timezone.utc)
                    user.is_online = False
                    user.last_logout_at = now
                    user.update_timestamp()
                    await user.save()

                    try:
                        await admin_ws_manager.broadcast("USER_LOGOUT", {
                            "user_id": str(user.id),
                            "email": user.email,
                            "timestamp": now.isoformat()
                        })
                    except Exception as err:
                        logger.warning(f"Failed to broadcast USER_LOGOUT event: {err}")
        except Exception:
            remaining_ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
        blacklist_token(refresh_token, remaining_ttl)
        logger.info("Refresh token revoked on logout (ttl=%ds)", remaining_ttl)

    @staticmethod
    async def request_password_reset(email: str) -> str:

        user = await UserDocument.find_one(UserDocument.email == email.lower())
        if not user:
            # We still return success to prevent email enumeration attacks
            return "If the email is registered, a password reset link has been generated."
        
        reset_token = str(uuid.uuid4())
        user.reset_password_token = reset_token
        user.reset_password_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        user.update_timestamp()
        await user.save()

        try:
            await EmailService.send_password_reset_email(user.email, reset_token)
        except Exception as e:
            logger.error(f"Failed to dispatch password reset email to {user.email}: {e}", exc_info=True)

        return "If the email is registered, a password reset link has been sent to your email."

    @staticmethod
    async def reset_password(token: str, new_password: str) -> bool:
        user = await UserDocument.find_one(UserDocument.reset_password_token == token)
        if not user or not user.reset_password_expires_at:
            raise AuthenticationError("Invalid or expired password reset token", code="INVALID_RESET_TOKEN")

        expires_at = user.reset_password_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if datetime.now(timezone.utc) > expires_at:
            raise AuthenticationError("Password reset token has expired", code="EXPIRED_RESET_TOKEN")

        user.hashed_password = get_password_hash(new_password)
        user.reset_password_token = None
        user.reset_password_expires_at = None
        user.update_timestamp()
        await user.save()
        return True

    @staticmethod
    async def verify_email(token: str) -> bool:
        user = await UserDocument.find_one(UserDocument.verification_token == token)
        if not user:
            raise AuthenticationError("This verification link is invalid or has already been used. If your email is already verified, you can sign in directly.", code="INVALID_VERIFICATION_TOKEN")

        user.is_verified = True
        user.verification_token = None
        user.update_timestamp()
        await user.save()
        return True

    @staticmethod
    async def resend_verification(user: UserDocument) -> str:
        if user.is_verified:
            return "Email is already verified."

        if not user.verification_token:
            user.verification_token = str(uuid.uuid4())
            user.update_timestamp()
            await user.save()

        await EmailService.send_verification_email(user.email, user.verification_token)
        return "Verification email sent successfully."
