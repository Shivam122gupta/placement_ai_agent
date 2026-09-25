from typing import Optional, Any, Dict
from fastapi import HTTPException, status


class AppException(HTTPException):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ):
        super().__init__(status_code=status_code, detail=message, headers=headers)
        self.code = code
        self.message = message
        self.details = details or {}


class AuthenticationError(AppException):
    def __init__(self, message: str = "Invalid credentials or expired token", code: str = "AUTHENTICATION_FAILED"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code=code,
            message=message,
            headers={"WWW-Authenticate": "Bearer"},
        )


class PermissionDeniedError(AppException):
    def __init__(self, message: str = "You do not have permission to access this resource", code: str = "FORBIDDEN"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code=code,
            message=message,
        )


class ResourceNotFoundError(AppException):
    def __init__(self, resource: str, identifier: str = "", code: str = "NOT_FOUND"):
        msg = f"{resource} not found" if not identifier else f"{resource} with id '{identifier}' not found"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code=code,
            message=msg,
        )


class ConflictError(AppException):
    def __init__(self, message: str, code: str = "RESOURCE_CONFLICT"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code=code,
            message=message,
        )


class ValidationError(AppException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None, code: str = "VALIDATION_ERROR"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code=code,
            message=message,
            details=details,
        )


class RateLimitExceededError(AppException):
    def __init__(self, message: str = "Rate limit exceeded. Please retry later.", code: str = "RATE_LIMIT_EXCEEDED"):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            code=code,
            message=message,
        )
