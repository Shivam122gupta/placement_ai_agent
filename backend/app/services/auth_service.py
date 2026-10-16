from datetime import datetime, timezone, timedelta
from typing import Tuple, Optional
from beanie import PydanticObjectId
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    generate_secure_token,
    hash_token,
    constant_time_dummy_verify,
)
from app.core.exceptions import AuthenticationError, ConflictError
from app.core.token_blacklist import blacklist_token, is_blacklisted
import logging
from app.models.user import UserDocument
from app.models.profile import ProfileDocument
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from app.core.config import settings
from app.services.email_service import EmailService

from app.services.admin_ws_service import admin_ws_manager

logger = logging.getLogger(__name__)


def _ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


class AuthService:
    @staticmethod
    async def register(req: UserRegisterRequest) -> Tuple[UserResponse, TokenResponse]:
        # 1. Check if user already exists
        existing_user = await UserDocument.find_one({"email": req.email.lower()})
        if existing_user:
            raise ConflictError(f"User with email '{req.email}' already exists", code="EMAIL_ALREADY_EXISTS")

        # 2. Hash password & generate secure expiring verification token
        now = datetime.now(timezone.utc)
        hashed_password = get_password_hash(req.password)
        raw_verification_token = generate_secure_token()
        token_hash = hash_token(raw_verification_token)
        verification_expires_at = now + timedelta(hours=settings.VERIFICATION_TOKEN_EXPIRE_HOURS)

        user = UserDocument(
            email=req.email.lower(),
            hashed_password=hashed_password,
            is_active=True,
            is_verified=False,
            is_online=True,
            last_login_at=now,
            last_active_at=now,
            verification_token=token_hash,
            verification_token_expires_at=verification_expires_at,
            token_version=1,
            failed_login_attempts=0,
            locked_until=None,
        )
        await user.insert()

        # 3. Create initial empty profile
        profile = ProfileDocument(
            user_id=user.id,
            full_name=req.full_name or "",
            contact_email=req.email.lower(),
        )
        await profile.insert()

        # Send verification email with raw token
        try:
            await EmailService.send_verification_email(user.email, raw_verification_token, req.full_name)
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

        # 4. Generate JWT tokens with token_version tracking
        access_token = create_access_token(subject=str(user.id), token_version=user.token_version)
        refresh_token = create_refresh_token(subject=str(user.id), token_version=user.token_version)

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
        now = datetime.now(timezone.utc)
        user = await UserDocument.find_one({"email": req.email.lower()})

        # Anti-enumeration timing attack mitigation
        if not user:
            constant_time_dummy_verify(req.password)
            raise AuthenticationError("Invalid email or password", code="INVALID_CREDENTIALS")

        # 1. Account Lockout Check (Anti-Brute-Force & Credential Stuffing Defense)
        locked_until = _ensure_utc(user.locked_until)
        if locked_until and now < locked_until:
            remaining_seconds = int((locked_until - now).total_seconds())
            remaining_minutes = max(1, (remaining_seconds + 59) // 60)
            logger.warning(f"Login attempted on locked account: {user.email} (locked for {remaining_minutes}m)")
            raise AuthenticationError(
                f"Account is temporarily locked due to multiple failed login attempts. Please try again in {remaining_minutes} minute(s) or reset your password.",
                code="ACCOUNT_LOCKED"
            )

        # 2. Verify password with bcrypt
        if not verify_password(req.password, user.hashed_password):
            user.failed_login_attempts = getattr(user, "failed_login_attempts", 0) + 1
            if user.failed_login_attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
                user.locked_until = now + timedelta(minutes=settings.ACCOUNT_LOCKOUT_MINUTES)
                user.failed_login_attempts = 0
                user.update_timestamp()
                await user.save()
                logger.warning(
                    f"Account {user.email} has been locked for {settings.ACCOUNT_LOCKOUT_MINUTES}m "
                    f"due to {settings.MAX_FAILED_LOGIN_ATTEMPTS} failed attempts."
                )
                raise AuthenticationError(
                    f"Account has been temporarily locked for {settings.ACCOUNT_LOCKOUT_MINUTES} minutes due to {settings.MAX_FAILED_LOGIN_ATTEMPTS} failed login attempts.",
                    code="ACCOUNT_LOCKED"
                )
            user.update_timestamp()
            await user.save()
            raise AuthenticationError("Invalid email or password", code="INVALID_CREDENTIALS")

        # 3. Check account active status
        if not user.is_active:
            raise AuthenticationError("Your account has been deactivated. Please contact support.", code="ACCOUNT_INACTIVE")

        # 4. Enforce email verification if configured
        if settings.REQUIRE_EMAIL_VERIFICATION and not user.is_verified:
            logger.info(f"Unverified login attempt for {user.email}")
            raise AuthenticationError(
                "Your email address is not verified. Please check your inbox for the verification link or use resend-verification.",
                code="EMAIL_NOT_VERIFIED"
            )

        # 5. Successful login: reset failure counter and release any lock
        user.failed_login_attempts = 0
        user.locked_until = None
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

        token_version = getattr(user, "token_version", 1)
        access_token = create_access_token(subject=str(user.id), token_version=token_version)
        refresh_token = create_refresh_token(subject=str(user.id), token_version=token_version)

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

        # Session invalidation check: verify token_version
        token_ver = payload.get("ver")
        if token_ver is not None and token_ver != getattr(user, "token_version", 1):
            raise AuthenticationError("Session has been invalidated. Please login again.", code="SESSION_INVALIDATED")

        # Rotate: blacklist the old refresh token so it cannot be reused
        try:
            exp = payload.get("exp", 0)
            remaining_ttl = max(1, int(exp - datetime.now(timezone.utc).timestamp()))
        except Exception:
            remaining_ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
        blacklist_token(refresh_token, remaining_ttl)

        current_ver = getattr(user, "token_version", 1)
        new_access_token = create_access_token(subject=str(user.id), token_version=current_ver)
        new_refresh_token = create_refresh_token(subject=str(user.id), token_version=current_ver)

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    @staticmethod
    async def logout(
        refresh_token: Optional[str] = None,
        access_token: Optional[str] = None,
        user: Optional[UserDocument] = None,
    ) -> None:
        """
        Revokes both refresh and access tokens, and marks user as offline in database.
        """
        now = datetime.now(timezone.utc)

        # 1. Blacklist Refresh Token
        if refresh_token:
            try:
                payload = decode_refresh_token(refresh_token)
                exp = payload.get("exp", 0)
                remaining_ttl = max(1, int(exp - now.timestamp()))
                blacklist_token(refresh_token, remaining_ttl)
                user_id = payload.get("sub")
                if not user and user_id:
                    user = await UserDocument.get(PydanticObjectId(user_id))
            except Exception:
                blacklist_token(refresh_token, settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400)

        # 2. Blacklist Access Token (Immediately revokes current session)
        if access_token:
            try:
                payload = decode_access_token(access_token)
                exp = payload.get("exp", 0)
                remaining_ttl = max(1, int(exp - now.timestamp()))
                blacklist_token(access_token, remaining_ttl)
                if not user and payload.get("sub"):
                    user = await UserDocument.get(PydanticObjectId(payload.get("sub")))
            except Exception:
                blacklist_token(access_token, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)

        # 3. Update database presence
        if user:
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

        logger.info(f"User session terminated and tokens revoked successfully.")

    @staticmethod
    async def request_password_reset(email: str) -> str:
        """
        Generates a secure, expiring password reset token.
        Always returns generic message to prevent email enumeration attacks.
        """
        user = await UserDocument.find_one({"email": email.lower()})
        if not user:
            constant_time_dummy_verify("dummy_password_enumeration_prevent")
            return "If the email is registered, a password reset link has been generated."

        raw_reset_token = generate_secure_token()
        user.reset_password_token = hash_token(raw_reset_token)
        user.reset_password_expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
        user.update_timestamp()
        await user.save()

        try:
            await EmailService.send_password_reset_email(user.email, raw_reset_token)
        except Exception as e:
            logger.error(f"Failed to dispatch password reset email to {user.email}: {e}", exc_info=True)

        return "If the email is registered, a password reset link has been sent to your email."

    @staticmethod
    async def reset_password(token: str, new_password: str) -> bool:
        """
        Resets user password with token expiration validation, secure hashing,
        and invalidates all previous sessions via token_version increment.
        """
        token_hash = hash_token(token)
        user = await UserDocument.find_one({"reset_password_token": token_hash})
        # Backward compatibility for legacy raw tokens
        if not user:
            user = await UserDocument.find_one({"reset_password_token": token})

        if not user or not user.reset_password_expires_at:
            raise AuthenticationError("Invalid or expired password reset token", code="INVALID_RESET_TOKEN")

        expires_at = _ensure_utc(user.reset_password_expires_at)
        if expires_at and datetime.now(timezone.utc) > expires_at:
            raise AuthenticationError("Password reset token has expired. Please request a new reset link.", code="EXPIRED_RESET_TOKEN")

        # Secure password update & session invalidation
        user.hashed_password = get_password_hash(new_password)
        user.reset_password_token = None
        user.reset_password_expires_at = None
        user.token_version = getattr(user, "token_version", 1) + 1  # Invalidate all prior sessions
        user.failed_login_attempts = 0
        user.locked_until = None
        user.update_timestamp()
        await user.save()

        logger.info(f"Password reset successfully for {user.email}. All existing sessions invalidated.")
        return True

    @staticmethod
    async def verify_email(token: str) -> bool:
        """
        Verifies email using single-use secure expiring token.
        """
        token_hash = hash_token(token)
        user = await UserDocument.find_one({"verification_token": token_hash})
        # Backward compatibility for legacy raw tokens
        if not user:
            user = await UserDocument.find_one({"verification_token": token})

        if not user:
            raise AuthenticationError("This verification link is invalid or has already been used. If your email is already verified, you can sign in directly.", code="INVALID_VERIFICATION_TOKEN")

        expires_at = _ensure_utc(user.verification_token_expires_at)
        if expires_at and datetime.now(timezone.utc) > expires_at:
            raise AuthenticationError("This verification link has expired. Please request a new verification email.", code="EXPIRED_VERIFICATION_TOKEN")

        user.is_verified = True
        user.verification_token = None
        user.verification_token_expires_at = None
        user.update_timestamp()
        await user.save()

        logger.info(f"Email verified successfully for {user.email}")
        return True

    @staticmethod
    async def resend_verification(user: UserDocument) -> str:
        """
        Regenerates and dispatches a new secure email verification token.
        """
        if user.is_verified:
            return "Email is already verified."

        now = datetime.now(timezone.utc)
        raw_token = generate_secure_token()
        user.verification_token = hash_token(raw_token)
        user.verification_token_expires_at = now + timedelta(hours=settings.VERIFICATION_TOKEN_EXPIRE_HOURS)
        user.update_timestamp()
        await user.save()

        await EmailService.send_verification_email(user.email, raw_token)
        return "Verification email sent successfully."
