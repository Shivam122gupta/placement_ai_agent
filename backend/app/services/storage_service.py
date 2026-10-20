import os
import io
import re
import uuid
import hashlib
import zipfile
from pathlib import Path
from typing import Tuple, Set
from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import ValidationError
from app.core.sanitizer import sanitize_filename

# Strict allowlist of extensions and corresponding MIME types
ALLOWED_EXTENSIONS: Set[str] = {".pdf", ".docx"}

ALLOWED_MIME_BY_EXTENSION = {
    ".pdf": {"application/pdf", "application/x-pdf", "application/octet-stream"},
    ".docx": {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/octet-stream",
    },
}

# Dangerous intermediate extensions used in double-extension attacks
DANGEROUS_EXTENSIONS = {
    ".exe", ".dll", ".so", ".dylib", ".bat", ".cmd", ".ps1", ".sh", ".bash",
    ".php", ".phtml", ".php3", ".php4", ".php5", ".phps", ".py", ".rb", ".pl",
    ".cgi", ".js", ".vbs", ".wsf", ".scr", ".pif", ".com", ".jar", ".war",
    ".jsp", ".asp", ".aspx", ".cer", ".csr", ".msi", ".hta", ".docm", ".xlsm",
    ".pptm", ".vba", ".bin"
}

# Known malicious binary signatures (Magic Bytes)
DANGEROUS_BINARY_SIGNATURES = [
    (b"MZ", "Windows PE executable/DLL"),
    (b"\x7fELF", "Linux ELF executable"),
    (b"\xfe\xed\xfa\xce", "Mach-O 32-bit executable"),
    (b"\xfe\xed\xfa\xcf", "Mach-O 64-bit executable"),
    (b"\xce\xfa\xed\xfe", "Mach-O executable"),
    (b"\xcf\xfa\xed\xfe", "Mach-O executable"),
    (b"\xca\xfe\xba\xbe", "Java Class or Mach-O Universal binary"),
    (b"#!", "Unix shell script shebang"),
    (b"<?php", "PHP script"),
    (b"<?", "Server script"),
    (b"<%", "ASP/JSP script"),
    (b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1", "Legacy OLE2 compound document (potential macro container)"),
]

# Text-based script masquerades and script injections
DANGEROUS_TEXT_PATTERNS = [
    b"<html",
    b"<!doctype html",
    b"<script",
    b"<svg",
    b"<iframe",
    b"powershell",
    b"@echo off",
    b"cmd.exe",
]

# Dangerous PDF object tags associated with code execution or external launch
DANGEROUS_PDF_OBJECTS = [
    b"/Launch",          # Launches external OS application
    b"/EmbeddedFiles",   # Embeds arbitrary binary payloads
    b"/JavaScript",      # Embedded Acrobat JavaScript
    b"/JS",              # Short alias for JavaScript
]


class StorageService:
    @staticmethod
    def get_user_storage_dir(user_id: str) -> Path:
        base_dir = Path(settings.UPLOAD_STORAGE_DIR).resolve()
        user_dir = base_dir / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)
        try:
            # Enforce strict private directory permissions (drwx------)
            os.chmod(user_dir, 0o700)
        except OSError:
            pass
        return user_dir

    @classmethod
    async def save_resume_file(cls, user_id: str, file: UploadFile) -> Tuple[str, str, int, str]:
        """
        Performs enterprise-grade multi-layered file upload validation:
        1. Allowlist enforcement: only .pdf and .docx permitted.
        2. Double-extension attack prevention: checks all secondary extensions.
        3. Strict MIME type verification matching the file format.
        4. Memory-safe streaming size checks (bounded buffer, DoS prevention).
        5. Malicious binary signature detection (PE, ELF, Mach-O, scripts, OLE2).
        6. PDF deep inspection: verifies %PDF- header and blocks /Launch, /JavaScript, /EmbeddedFiles.
        7. DOCX deep inspection: verifies OpenXML structure, blocks VBA macros (.docm), and prevents zip bombs.
        8. Randomized UUID storage in isolated user directories with execute permissions stripped (0o600).
        Returns: (saved_relative_path, original_filename, file_size_bytes, sha256_checksum)
        """
        # 1. Filename & Extension Sanitization
        raw_filename = file.filename or "resume.pdf"
        clean_filename = sanitize_filename(raw_filename)
        path_obj = Path(clean_filename)
        ext = path_obj.suffix.lower()

        # Check primary extension against allowlist
        if ext not in ALLOWED_EXTENSIONS:
            raise ValidationError(
                f"Unsupported file format '{ext}'. Allowed formats: PDF (.pdf), Word (.docx)",
                code="UNSUPPORTED_FILE_TYPE",
            )

        # Check for double extension attacks (e.g. resume.php.pdf, payload.exe.docx)
        all_suffixes = [s.lower() for s in path_obj.suffixes[:-1]]
        for secondary_ext in all_suffixes:
            if secondary_ext in DANGEROUS_EXTENSIONS:
                raise ValidationError(
                    f"Suspicious double extension '{secondary_ext}' detected. Executable or script extensions are forbidden.",
                    code="DOUBLE_EXTENSION_BLOCKED",
                )

        # 2. Validate MIME Type against allowable types for this specific extension
        content_type = (file.content_type or "").lower().strip()
        valid_mimes = ALLOWED_MIME_BY_EXTENSION.get(ext, set())
        if content_type and content_type not in valid_mimes:
            raise ValidationError(
                f"Invalid MIME type '{content_type}' for format '{ext}'.",
                code="INVALID_MIME_TYPE",
            )

        # 3. Streamed Bounded Read (Memory-Safe Size Enforcement & DoS Prevention)
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        chunk_size = 64 * 1024  # 64 KB chunks
        content_buffer = io.BytesIO()
        total_read = 0

        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            total_read += len(chunk)
            if total_read > max_bytes:
                content_buffer.close()
                raise ValidationError(
                    f"File size exceeds the maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB.",
                    code="FILE_TOO_LARGE",
                )
            content_buffer.write(chunk)

        content = content_buffer.getvalue()
        file_size = len(content)

        # Reject completely empty files upfront
        if file_size == 0:
            raise ValidationError(
                "Uploaded file is empty.",
                code="EMPTY_FILE",
            )

        # 4. Binary & Script Magic Byte Inspection (First 512 bytes)
        header_bytes = content[:512]
        for signature, sig_desc in DANGEROUS_BINARY_SIGNATURES:
            if header_bytes.startswith(signature):
                raise ValidationError(
                    f"Malicious file upload blocked: File contains forbidden {sig_desc} signature.",
                    code="MALICIOUS_FILE_BLOCKED",
                )

        header_preview = header_bytes.lower()
        for text_pattern in DANGEROUS_TEXT_PATTERNS:
            if text_pattern in header_preview:
                raise ValidationError(
                    "File contains embedded HTML, script, or command payload and cannot be accepted.",
                    code="UNSAFE_FILE_CONTENT",
                )

        # Validate minimum legitimate document size
        if file_size < 32:
            raise ValidationError(
                "Uploaded file is too small or corrupt to be a valid document.",
                code="EMPTY_FILE",
            )

        # 5. Format-Specific Deep Inspection
        if ext == ".pdf":
            # PDF must start with %PDF- (within first 1024 bytes per ISO 32000-1)
            pdf_header_index = content[:1024].find(b"%PDF-")
            if pdf_header_index == -1:
                raise ValidationError(
                    "Invalid PDF format: Missing standard %PDF- magic signature.",
                    code="CORRUPT_OR_SPOOFED_FILE",
                )

            # Deep scan for malicious PDF active content / exploit objects
            # Scan first 64KB and last 16KB where root objects and dictionaries reside
            scan_chunk = content[:65536] + content[-16384:] if file_size > 81920 else content
            for bad_obj in DANGEROUS_PDF_OBJECTS:
                if bad_obj in scan_chunk:
                    raise ValidationError(
                        "PDF contains unsafe active scripting or executable launch actions.",
                        code="MALICIOUS_PDF_OBJECT_BLOCKED",
                    )

        elif ext == ".docx":
            # DOCX must start with PK\x03\x04 (ZIP signature)
            if not content.startswith(b"PK\x03\x04"):
                raise ValidationError(
                    "Invalid DOCX format: Missing OpenXML ZIP magic signature.",
                    code="CORRUPT_OR_SPOOFED_FILE",
                )

            # Inspect ZIP entries for Zip Bombs, VBA Macros, and embedded executables
            try:
                with zipfile.ZipFile(io.BytesIO(content)) as zf:
                    infolist = zf.infolist()

                    # Zip bomb protection: max file count check
                    if len(infolist) > 500:
                        raise ValidationError(
                            "DOCX archive contains too many files (potential zip bomb).",
                            code="ZIP_BOMB_DETECTED",
                        )

                    # Zip bomb protection: max uncompressed size check (25MB limit)
                    total_uncompressed = sum(info.file_size for info in infolist)
                    if total_uncompressed > 25 * 1024 * 1024:
                        raise ValidationError(
                            "DOCX uncompressed size exceeds maximum safety limits (25MB).",
                            code="ZIP_BOMB_DETECTED",
                        )

                    entry_names = [info.filename for info in infolist]

                    # Verify legitimate OpenXML structures
                    has_content_types = any("[Content_Types].xml" in name for name in entry_names)
                    has_document = any("word/document.xml" in name for name in entry_names)
                    if not (has_content_types and has_document):
                        raise ValidationError(
                            "Invalid DOCX structure: Missing standard OpenXML document streams.",
                            code="CORRUPT_OR_SPOOFED_FILE",
                        )

                    # Check each entry for VBA Macros and embedded executables
                    for name in entry_names:
                        norm_name = name.lower()

                        # Prevent Zip path traversal attacks
                        if ".." in name or norm_name.startswith(("/", "\\")):
                            raise ValidationError(
                                "DOCX package contains forbidden path traversal entry.",
                                code="PATH_TRAVERSAL_DETECTED",
                            )

                        # Block VBA Macros (.docm masquerading as .docx)
                        if "vbaproject.bin" in norm_name or "vbadata.xml" in norm_name or norm_name.startswith("word/vba"):
                            raise ValidationError(
                                "DOCX contains executable VBA macro code. Macro-enabled documents (.docm) are strictly forbidden.",
                                code="MACRO_CODE_BLOCKED",
                            )

                        # Block any embedded binary/executable files
                        for bad_ext in DANGEROUS_EXTENSIONS:
                            if norm_name.endswith(bad_ext):
                                raise ValidationError(
                                    f"DOCX archive contains dangerous embedded payload '{name}'.",
                                    code="EMBEDDED_EXECUTABLE_BLOCKED",
                                )

            except zipfile.BadZipFile:
                raise ValidationError("Corrupt or invalid DOCX archive.", code="CORRUPT_OR_SPOOFED_FILE")

        # 6. Secure Storage (Randomized UUID Filename, Isolated Directory, No-Execute Permissions)
        sha256 = hashlib.sha256(content).hexdigest()
        unique_name = f"{uuid.uuid4().hex}{ext}"
        user_dir = cls.get_user_storage_dir(user_id)
        target_path = user_dir / unique_name

        with open(target_path, "wb") as f:
            f.write(content)

        # Strip execute permissions on the written file (0o600: read/write owner only)
        try:
            os.chmod(target_path, 0o600)
        except OSError:
            pass

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
