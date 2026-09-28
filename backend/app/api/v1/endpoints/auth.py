from fastapi import APIRouter, Depends, status
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
    UserResponse,
)
from app.schemas.common import StandardResponse, MessageResponse
from app.services.auth_service import AuthService
from app.api.deps import get_current_active_user
from app.models.user import UserDocument

from app.core.rate_limit import rate_limit

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=StandardResponse[dict],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(requests_limit=5, window_seconds=60, key_prefix="auth_reg"))],
)
async def register(req: UserRegisterRequest):
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
async def login(req: UserLoginRequest):
    user, tokens = await AuthService.login(req)
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
async def logout(current_user: UserDocument = Depends(get_current_active_user)):
    # In stateless JWT, clients discard tokens. For server-side revocation, blacklisting in Redis is handled in Phase 10.
    return StandardResponse(
        success=True,
        message="Logged out successfully",
        data=MessageResponse(message="Logged out successfully")
    )


@router.post("/verify-email", response_model=StandardResponse[MessageResponse], status_code=status.HTTP_200_OK)
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
