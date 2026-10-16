from fastapi import APIRouter, Depends, status, Request, HTTPException
from app.core.security_logger import get_client_ip, security_logger, SecurityEventType
from app.core.rate_limiter import check_login_email_rate_limit
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    LogoutRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
    UserResponse,
)
from app.schemas.common import StandardResponse, MessageResponse
from app.services.auth_service import AuthService
from typing import Optional
from fastapi.security import HTTPAuthorizationCredentials
from app.api.deps import get_current_active_user, security_scheme
from app.models.user import UserDocument

from app.core.rate_limit import rate_limit

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=StandardResponse[dict],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(requests_limit=5, window_seconds=60, key_prefix="auth_reg"))],
)
async def register(req: UserRegisterRequest, request: Request):
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("User-Agent")

    # Honeypot validation against automated form-filling bots
    if req.website:
        security_logger.log_event(
            event_type=SecurityEventType.BOT_HONEYPOT_TRIGGERED,
            severity="WARNING",
            client_ip=client_ip,
            user_agent=user_agent,
            endpoint="/api/v1/auth/register",
            details={
                "honeypot_value": req.website[:50],
                "action": "BLOCKED_BOT_REGISTRATION",
            },
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration submission rejected by bot protection filter.",
        )

    user, tokens = await AuthService.register(req)
    return StandardResponse(
        success=True,
        message="Account registered successfully",
        data={
            "user": user.model_dump(),
            "tokens": tokens.model_dump(),
        }
    )


@router.post(
    "/login",
    response_model=StandardResponse[dict],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit(requests_limit=10, window_seconds=60, key_prefix="auth_login"))],
)
async def login(req: UserLoginRequest, request: Request):
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("User-Agent")

    # Anti-credential stuffing: throttle repeated attempts on the target email across distributed IPs
    is_test_env = getattr(request.app.state, "disable_rate_limiting", False)
    test_rate_check = request.headers.get("X-Test-Rate-Limit") == "true"
    if not is_test_env or test_rate_check:
        allowed, retry_after = check_login_email_rate_limit(req.email)
        if not allowed:
            security_logger.log_event(
                event_type=SecurityEventType.RATE_LIMIT_EXCEEDED,
                severity="WARNING",
                client_ip=client_ip,
                user_agent=user_agent,
                email=req.email,
                endpoint="/api/v1/auth/login",
                details={
                    "action": "EMAIL_LOGIN_RATE_LIMITED",
                    "retry_after_seconds": retry_after,
                },
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many login attempts for this account. Please wait {retry_after} seconds before trying again.",
                headers={"Retry-After": str(retry_after)},
            )

    user, tokens = await AuthService.login(req, client_ip=client_ip, user_agent=user_agent)
    return StandardResponse(
        success=True,
        message="Logged in successfully",
        data={
            "user": user.model_dump(),
            "tokens": tokens.model_dump(),
        }
    )


@router.post("/refresh", response_model=StandardResponse[TokenResponse], status_code=status.HTTP_200_OK)
async def refresh_tokens(req: RefreshTokenRequest):
    tokens = await AuthService.refresh_tokens(req.refresh_token)
    return StandardResponse(
        success=True,
        message="Token refreshed successfully",
        data=tokens
    )


@router.post("/logout", response_model=StandardResponse[MessageResponse], status_code=status.HTTP_200_OK)
async def logout(
    req: LogoutRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    current_user: UserDocument = Depends(get_current_active_user),
):
    # Server-side token revocation: blacklist both refresh and access tokens
    access_token = req.access_token or (credentials.credentials if credentials else None)
    await AuthService.logout(
        refresh_token=req.refresh_token,
        access_token=access_token,
        user=current_user
    )
    return StandardResponse(
        success=True,
        message="Logged out successfully",
        data=MessageResponse(message="Logged out successfully")
    )


@router.post(
    "/verify-email",
    response_model=StandardResponse[MessageResponse],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit(requests_limit=10, window_seconds=60, key_prefix="auth_verify"))],
)
async def verify_email(req: VerifyEmailRequest):
    await AuthService.verify_email(req.token)
    return StandardResponse(
        success=True,
        message="Email verified successfully",
        data=MessageResponse(message="Email verified successfully")
    )


@router.post(
    "/resend-verification",
    response_model=StandardResponse[MessageResponse],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit(requests_limit=3, window_seconds=60, key_prefix="auth_resend"))],
)
async def resend_verification(current_user: UserDocument = Depends(get_current_active_user)):
    msg = await AuthService.resend_verification(current_user)
    return StandardResponse(
        success=True,
        message=msg,
        data=MessageResponse(message=msg)
    )


@router.post(
    "/forgot-password",
    response_model=StandardResponse[MessageResponse],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit(requests_limit=5, window_seconds=60, key_prefix="auth_forgot"))],
)
async def forgot_password(req: ForgotPasswordRequest):
    msg = await AuthService.request_password_reset(req.email)
    return StandardResponse(
        success=True,
        message=msg,
        data=MessageResponse(message=msg)
    )


@router.post(
    "/reset-password",
    response_model=StandardResponse[MessageResponse],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit(requests_limit=5, window_seconds=60, key_prefix="auth_reset"))],
)
async def reset_password(req: ResetPasswordRequest):
    await AuthService.reset_password(req.token, req.new_password)
    return StandardResponse(
        success=True,
        message="Password reset successfully. You can now login with your new password.",
        data=MessageResponse(message="Password reset successfully")
    )


@router.get("/me", response_model=StandardResponse[UserResponse], status_code=status.HTTP_200_OK)
async def get_me(current_user: UserDocument = Depends(get_current_active_user)):
    return StandardResponse(
        success=True,
        message="Current user profile fetched",
        data=UserResponse(
            id=str(current_user.id),
            email=current_user.email,
            role=getattr(current_user, "role", "user"),
            is_active=current_user.is_active,
            is_verified=current_user.is_verified,
            created_at=current_user.created_at.isoformat(),
        )
    )
