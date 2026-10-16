import os
import json
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import Request

from app.core.config import settings


# Security Event Type Constants
class SecurityEventType:
    AUTH_LOGIN_SUCCESS = "AUTH_LOGIN_SUCCESS"
    AUTH_LOGIN_FAILED = "AUTH_LOGIN_FAILED"
    AUTH_ACCOUNT_LOCKED = "AUTH_ACCOUNT_LOCKED"
    AUTH_REGISTER_SUCCESS = "AUTH_REGISTER_SUCCESS"
    AUTH_LOGOUT = "AUTH_LOGOUT"
    AUTH_TOKEN_REVOKED = "AUTH_TOKEN_REVOKED"
    AUTH_PASSWORD_RESET_REQUEST = "AUTH_PASSWORD_RESET_REQUEST"
    AUTH_PASSWORD_RESET_SUCCESS = "AUTH_PASSWORD_RESET_SUCCESS"
    AUTH_EMAIL_VERIFIED = "AUTH_EMAIL_VERIFIED"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    AI_RATE_LIMIT_EXCEEDED = "AI_RATE_LIMIT_EXCEEDED"
    BOT_DETECTED = "BOT_DETECTED"
    BOT_HONEYPOT_TRIGGERED = "BOT_HONEYPOT_TRIGGERED"
    DATA_SCRAPING_DETECTED = "DATA_SCRAPING_DETECTED"
    SUSPICIOUS_TRAFFIC = "SUSPICIOUS_TRAFFIC"
    SUSPICIOUS_PAYLOAD = "SUSPICIOUS_PAYLOAD"
    HIGH_FREQUENCY_404_SCANNER = "HIGH_FREQUENCY_404_SCANNER"
    API_ERROR_5XX = "API_ERROR_5XX"
    API_ACCESS_DENIED = "API_ACCESS_DENIED"
    CONFIG_WARNING = "CONFIG_WARNING"


def get_client_ip(request: Request) -> str:
    """
    Extracts the genuine client IP address considering Cloudflare,
    reverse proxies (Render, AWS ALB, Nginx), and direct connections.
    """
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()

    x_forwarded = request.headers.get("X-Forwarded-For")
    if x_forwarded:
        ips = [ip.strip() for ip in x_forwarded.split(",")]
        if ips:
            return ips[0]

    x_real = request.headers.get("X-Real-IP")
    if x_real:
        return x_real.strip()

    if request.client and request.client.host:
        return request.client.host

    return "127.0.0.1"


class SecurityAuditLogger:
    """
    High-integrity security event logger.
    Logs structured, timestamped audit events to both application stdout
    and a dedicated rotating security log file (logs/security_audit.log).
    """

    def __init__(self):
        self.logger = logging.getLogger("app.security.audit")
        self.logger.setLevel(logging.INFO)

        # Setup rotating file handler for persistent security audit trail
        try:
            log_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "logs"))
            os.makedirs(log_dir, exist_ok=True)
            log_file = os.path.join(log_dir, "security_audit.log")

            # Max 10MB per file, retain 5 backups
            file_handler = RotatingFileHandler(
                log_file,
                maxBytes=10 * 1024 * 1024,
                backupCount=5,
                encoding="utf-8",
            )
            formatter = logging.Formatter("%(asctime)s | %(levelname)-8s | %(message)s")
            file_handler.setFormatter(formatter)
            self.logger.addHandler(file_handler)
        except Exception as e:
            # Fallback gracefully if directory is non-writable
            self.logger.warning(f"Could not initialize rotating security file handler: {e}")

    def log_event(
        self,
        event_type: str,
        severity: str = "INFO",  # "INFO", "WARNING", "CRITICAL"
        client_ip: str = "unknown",
        user_agent: Optional[str] = None,
        user_id: Optional[str] = None,
        email: Optional[str] = None,
        endpoint: Optional[str] = None,
        method: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        """Dispatches a structured security audit event."""
        now_iso = datetime.now(timezone.utc).isoformat()
        event_payload = {
            "timestamp": now_iso,
            "security_event": event_type,
            "severity": severity.upper(),
            "client_ip": client_ip,
            "user_agent": user_agent or "unknown",
            "user_id": str(user_id) if user_id else None,
            "email": email,
            "endpoint": endpoint,
            "method": method,
            "details": details or {},
        }

        # Format readable prefix for SIEM / log ingestion
        log_line = (
            f"[SECURITY_{severity.upper()}] event={event_type} "
            f"ip={client_ip} user={email or user_id or 'anonymous'} "
            f"endpoint={method or ''}:{endpoint or ''} "
            f"payload={json.dumps(event_payload.get('details', {}))}"
        )

        if severity.upper() == "CRITICAL":
            self.logger.critical(log_line)
        elif severity.upper() == "WARNING":
            self.logger.warning(log_line)
        else:
            self.logger.info(log_line)


# Global singleton instance
security_logger = SecurityAuditLogger()
