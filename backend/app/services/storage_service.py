import os
import io
import uuid
import hashlib
import zipfile
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import ValidationError
from app.core.sanitizer import sanitize_filename


ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",  # Often sent by browsers for binary docs
}

# Known malicious executable signatures and script magic bytes
DANGEROUS_HEADER_PATTERNS = [
    b"MZ",           # Windows PE executable / DLL
    b"\x7fELF",      # Linux Executable and Linkable Format
    b"#!",           # Unix shell script / shebang
    b"<?php",        # PHP script
]


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
        Performs multi-layered upload verification:
        1. Extension check against strict whitelist (.pdf, .docx)
        2. Filename traversal sanitization
        3. MIME type inspection
        4. Size limits (MAX_UPLOAD_SIZE_MB)
        5. Deep Magic-byte inspection (verifies %PDF- or PK\\x03\\x04)
        6. Rejection of executable headers (MZ, ELF, shell scripts, HTML/SVG masquerades)
        7. Zip bomb decompression check on DOCX packages
        8. Sandboxed disk write with unique UUID filename
        Returns: (saved_relative_path, original_filename, file_size_bytes, sha256_checksum)
        """
        # 1. Sanitize and validate filename & extension
        raw_filename = file.filename or "resume.pdf"
        clean_filename = sanitize_filename(raw_filename)
        ext = Path(clean_filename).suffix.lower()

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

        # 4. Dangerous executable & script header rejection
        for dangerous_header in DANGEROUS_HEADER_PATTERNS:
            if content.startswith(dangerous_header):
                raise ValidationError(
                    "Malicious file upload detected: executable or script content is strictly prohibited.",
                    code="MALICIOUS_FILE_BLOCKED",
                )

        header_preview = content[:256].lower()
        if b"<html" in header_preview or b"<script" in header_preview or b"<svg" in header_preview:
            raise ValidationError(
                "File contains embedded HTML/script content and cannot be accepted.",
                code="UNSAFE_FILE_CONTENT",
            )

        # 5. Magic signature verification
        if ext == ".pdf":
            # PDF must start with %PDF-
            if not content.startswith(b"%PDF-"):
                raise ValidationError(
                    "Invalid PDF format: Missing %PDF- magic signature.",
                    code="CORRUPT_OR_SPOOFED_FILE",
                )
        elif ext == ".docx":
            # DOCX must start with PK\x03\x04 (Zip archive signature)
            if not content.startswith(b"PK\x03\x04"):
                raise ValidationError(
                    "Invalid DOCX format: Missing OpenXML ZIP magic signature.",
                    code="CORRUPT_OR_SPOOFED_FILE",
                )

            # Zip bomb & decompression bomb check
            try:
                with zipfile.ZipFile(io.BytesIO(content)) as zf:
                    # Enforce max file count inside archive
                    infolist = zf.infolist()
                    if len(infolist) > 500:
                        raise ValidationError(
                            "DOCX archive contains too many files (potential zip bomb).",
                            code="ZIP_BOMB_DETECTED",
                        )

                    total_uncompressed = sum(info.file_size for info in infolist)
                    # Limit uncompressed size to 25MB
                    if total_uncompressed > 25 * 1024 * 1024:
                        raise ValidationError(
                            "DOCX uncompressed size exceeds maximum safety limits.",
                            code="ZIP_BOMB_DETECTED",
                        )
            except zipfile.BadZipFile:
                raise ValidationError("Corrupt or invalid DOCX archive.", code="CORRUPT_OR_SPOOFED_FILE")

        sha256 = hashlib.sha256(content).hexdigest()

        # 6. Generate unique filename in user's isolated directory
        unique_name = f"{uuid.uuid4().hex}{ext}"
        user_dir = cls.get_user_storage_dir(user_id)
        target_path = user_dir / unique_name

        with open(target_path, "wb") as f:
            f.write(content)

        relative_path = f"{user_id}/{unique_name}"
        return relative_path, clean_filename, file_size, sha256

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
