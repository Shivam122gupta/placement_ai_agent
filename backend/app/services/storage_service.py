import os
import uuid
import hashlib
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile
from app.core.config import settings
from app.core.exceptions import ValidationError


ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",  # Often sent by browsers for binary docs
}


class StorageService:
    @staticmethod
    def get_user_storage_dir(user_id: str) -> Path:
        base_dir = Path(settings.UPLOAD_STORAGE_DIR).resolve()
        user_dir = base_dir / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)
        return user_dir

    @classmethod
    async def save_resume_file(cls, user_id: str, file: UploadFile) -> Tuple[str, str, int, str]:
        """
        Validates, computes checksum, and writes file to private sandboxed directory.
        Returns: (saved_relative_path, original_filename, file_size_bytes, sha256_checksum)
        """
        # 1. Validate extension
        filename = file.filename or "resume.pdf"
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValidationError(
                f"Unsupported file format '{ext}'. Allowed formats: PDF (.pdf), Word (.docx)",
                code="UNSUPPORTED_FILE_TYPE",
            )

        # 2. Validate MIME type
        content_type = file.content_type or ""
        if content_type and content_type not in ALLOWED_MIME_TYPES:
            raise ValidationError(
                f"Invalid file MIME type '{content_type}'.",
                code="INVALID_MIME_TYPE",
            )

        # 3. Read content and compute hash & size
        content = await file.read()
        file_size = len(content)
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            raise ValidationError(
                f"File size exceeds limit of {settings.MAX_UPLOAD_SIZE_MB}MB.",
                code="FILE_TOO_LARGE",
            )
        if file_size == 0:
            raise ValidationError("Uploaded file is empty.", code="EMPTY_FILE")

        sha256 = hashlib.sha256(content).hexdigest()

        # 4. Generate unique filename in user's isolated directory
        unique_name = f"{uuid.uuid4().hex}{ext}"
        user_dir = cls.get_user_storage_dir(user_id)
        target_path = user_dir / unique_name

        with open(target_path, "wb") as f:
            f.write(content)

        relative_path = f"{user_id}/{unique_name}"
        return relative_path, filename, file_size, sha256

    @classmethod
    def get_absolute_path(cls, relative_path: str) -> Path:
        base_dir = Path(settings.UPLOAD_STORAGE_DIR).resolve()
        target = (base_dir / relative_path).resolve()
        # Prevent directory traversal attacks
        if not str(target).startswith(str(base_dir)):
            raise ValidationError("Invalid file path.", code="PATH_TRAVERSAL_DETECTED")
        return target

    @classmethod
    def read_file_bytes(cls, relative_path: str) -> bytes:
        target = cls.get_absolute_path(relative_path)
        if not target.exists():
            raise ValidationError("File not found on disk.", code="FILE_NOT_FOUND")
        with open(target, "rb") as f:
            return f.read()

    @classmethod
    def delete_file(cls, relative_path: str) -> bool:
        try:
            target = cls.get_absolute_path(relative_path)
            if target.exists():
                os.remove(target)
                return True
        except Exception:
            pass
        return False
