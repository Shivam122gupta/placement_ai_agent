import re
import html
from pathlib import Path
from typing import Any, Dict, List, Union


# Regex to match script tags, iframes, onerror/onload attributes, and pseudo-protocols
SCRIPT_TAG_RE = re.compile(r"<\s*script[^>]*>.*?<\s*/\s*script\s*>", re.IGNORECASE | re.DOTALL)
HTML_TAG_RE = re.compile(r"<[^>]+>")
EVENT_HANDLER_RE = re.compile(r"on\w+\s*=\s*['\"][^'\"]*['\"]", re.IGNORECASE)
JS_PROTOCOL_RE = re.compile(r"(javascript|vbscript)\s*:", re.IGNORECASE)
DATA_URL_RE = re.compile(r"data:\s*(text/html|application/javascript|image/svg\+xml)", re.IGNORECASE)
NULL_BYTE_RE = re.compile(r"(\x00|%00)")
CONTROL_CHAR_RE = re.compile(r"[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]")

# Command injection symbols in sensitive shell-like contexts
COMMAND_INJECTION_CHARS = re.compile(r"[;&|`$><]")


def sanitize_text(text: str, allow_basic_formatting: bool = False, max_length: int = 10000) -> str:

    """
    Sanitizes string input to prevent Cross-Site Scripting (XSS), Null-byte attacks,
    and control-character pollution.
    - Strips null bytes (\x00) and control characters
    - Removes <script> blocks completely
    - Strips inline JS event handlers (e.g. onerror=, onclick=)
    - Strips javascript:, vbscript:, and malicious data: URLs
    - HTML-escapes content if basic formatting is not explicitly allowed
    - Enforces length bounding
    """
    if not isinstance(text, str) or not text:
        return ""

    # 1. Remove null bytes and dangerous unprintable control characters
    cleaned = NULL_BYTE_RE.sub("", text)
    cleaned = CONTROL_CHAR_RE.sub("", cleaned)

    # 2. Remove executable script blocks and embedded tags
    cleaned = SCRIPT_TAG_RE.sub("", cleaned)
    cleaned = EVENT_HANDLER_RE.sub("", cleaned)
    cleaned = JS_PROTOCOL_RE.sub("", cleaned)
    cleaned = DATA_URL_RE.sub("", cleaned)

    # 3. Strip HTML tags and escape HTML entities
    if not allow_basic_formatting:
        cleaned = HTML_TAG_RE.sub("", cleaned)
        cleaned = html.escape(cleaned, quote=True)
    else:
        # Strip script/iframe/object tags even if basic formatting is allowed
        cleaned = re.sub(r"<\s*(iframe|object|embed|applet|meta|link|base)[^>]*>", "", cleaned, flags=re.IGNORECASE)

    # Enforce length bound
    return cleaned.strip()[:max_length]


clean_text = sanitize_text



def is_safe_url(url: str) -> bool:
    """
    Validates that a URL strictly uses http:// or https:// (or mailto:),
    permanently blocking javascript:, data:, file:, and other dangerous pseudo-protocols.
    """
    if not isinstance(url, str) or not url.strip():
        return True  # Empty/None is handled by optional schema fields
    trimmed = url.strip().lower()
    return trimmed.startswith(("http://", "https://", "mailto:"))


def safe_regex_pattern(text: str, max_length: int = 150) -> str:
    """
    Escapes user-supplied search queries to prevent MongoDB ReDoS
    (Regular Expression Denial of Service) and operator injection.
    """
    if not text:
        return ""
    clean = NULL_BYTE_RE.sub("", text).strip()[:max_length]
    return re.escape(clean)


def sanitize_filename(filename: str, max_length: int = 100) -> str:
    """
    Sanitizes an uploaded file's original name:
    - Strips directory traversal sequences (../, ..\\)
    - Strips null bytes
    - Retains only safe characters: letters, numbers, hyphens, underscores, dots
    """
    if not filename:
        return "unnamed_file"

    # Remove path traversal and null bytes
    cleaned = NULL_BYTE_RE.sub("", filename)
    cleaned = Path(cleaned).name  # Strips any directory prefixes

    # Remove any character that is not alphanumeric, underscore, hyphen, or dot
    cleaned = re.sub(r"[^\w\.\-]", "_", cleaned)
    cleaned = re.sub(r"_{2,}", "_", cleaned)

    if not cleaned or cleaned.startswith("."):
        cleaned = f"file_{cleaned}"

    return cleaned[:max_length]


def sanitize_payload(payload: Union[Dict[str, Any], List[Any], str, Any]) -> Any:
    """
    Recursively sanitizes dictionary or list structures containing user inputs.
    Rejects or strips NoSQL operator keys (starting with '$').
    """
    if isinstance(payload, dict):
        clean_dict = {}
        for k, v in payload.items():
            # Strip or reject MongoDB query operators ($gt, $where, etc.) from user payloads
            clean_key = k.lstrip("$") if isinstance(k, str) else k
            clean_dict[clean_key] = sanitize_payload(v)
        return clean_dict
    elif isinstance(payload, list):
        return [sanitize_payload(item) for item in payload]
    elif isinstance(payload, str):
        return sanitize_text(payload)
    return payload
