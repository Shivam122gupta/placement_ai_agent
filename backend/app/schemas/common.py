from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, Field

T = TypeVar("T")


class StandardResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[T] = None


class MessageResponse(BaseModel):
    message: str
    success: bool = True


class PaginationMeta(BaseModel):
    total: int
    page: int
    size: int
    total_pages: int
