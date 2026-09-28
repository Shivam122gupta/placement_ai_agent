import re
import html
from typing import Any, Dict, List, Union


# Regex to match script tags, iframes, onerror/onload attributes, and javascript pseudo-protocol
SCRIPT_TAG_RE = re.compile(r"<\s*script[^>]*>.*?<\s*/\s*script\s*>", re.IGNORECASE | re.DOTALL)
HTML_TAG_RE = re.compile(r"<[^>]+>")
EVENT_HANDLER_RE = re.compile(r"on\w+\s*=\s*['\"][^'\"]*['\"]", re.IGNORECASE)
JS_PROTOCOL_RE = re.compile(r"javascript\s*:", re.IGNORECASE)


def sanitize_text(text: str, allow_basic_formatting: bool = False) -> str:
    """
    Sanitizes string input to prevent Cross-Site Scripting (XSS).
    - Removes <script> blocks completely
    - Strips inline JS event handlers (e.g. onerror=, onclick=)
    - Strips javascript: URLs
    - HTML-escapes content if basic formatting is not explicitly allowed
    """
    if not isinstance(text, str) or not text:
        return text

    # Remove executable script blocks
    cleaned = SCRIPT_TAG_RE.sub("", text)
    # Remove event handlers (e.g. <img src=x onerror=alert(1)>)
    cleaned = EVENT_HANDLER_RE.sub("", cleaned)
    # Remove javascript: protocol
    cleaned = JS_PROTOCOL_RE.sub("", cleaned)

    if not allow_basic_formatting:
        # Strip all HTML tags
        cleaned = HTML_TAG_RE.sub("", cleaned)
        # Escape remaining HTML special characters
        cleaned = html.escape(cleaned, quote=True)

    return cleaned.strip()


def sanitize_payload(payload: Union[Dict[str, Any], List[Any], str, Any]) -> Any:
    """
    Recursively sanitizes dictionary or list structures containing user inputs.
    """
    if isinstance(payload, dict):
        return {k: sanitize_payload(v) for k, v in payload.items()}
    elif isinstance(payload, list):
        return [sanitize_payload(item) for item in payload]
    elif isinstance(payload, str):
        return sanitize_text(payload)
    return payload
