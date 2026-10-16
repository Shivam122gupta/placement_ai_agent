import re
import time
import logging
from collections import defaultdict
from typing import Dict, List
from urllib.parse import unquote
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings
from app.core.security_logger import security_logger, SecurityEventType, get_client_ip

logger = logging.getLogger("app.security.traffic_monitor")

# Compiled malicious signature patterns
SUSPICIOUS_PATH_PATTERNS = [
    # Path Traversal
    re.compile(r"(\.\./|\.\.\\|%2e%2e%2f|%2e%2e/|\.\.%2f)", re.IGNORECASE),
    re.compile(r"/(etc/(passwd|shadow|hosts)|boot\.ini|win\.ini|windows/system32)", re.IGNORECASE),
    # Sensitive file probes
    re.compile(r"(\.env|\.git|\.aws|\.ssh|id_rsa|id_dsa|web\.config|\.htaccess|wp-config\.php)", re.IGNORECASE),
    # Known scanner endpoints & web shells
    re.compile(
        r"/(phpmyadmin|pma|cgi-bin|actuator/|solr/|xmlrpc\.php|wp-login\.php|eval-stdin\.php|telescope/requests|vendor/phpunit)",
        re.IGNORECASE,
    ),
]

SUSPICIOUS_QUERY_PATTERNS = [
    # SQL Injection heuristics
    re.compile(r"(union\s+all\s+select|union\s+select|information_schema|order\s+by\s+\d+|waitfor\s+delay)", re.IGNORECASE),
    # Script / XSS payload heuristics
    re.compile(r"(<script[^>]*>|javascript\s*:|onerror\s*=|onload\s*=|document\.cookie)", re.IGNORECASE),
]

# Signatures of automated scrapers, exploit bots, and headless scraping frameworks
KNOWN_BOT_USER_AGENTS = [
    # Common CLI scrapers and raw script libraries
    re.compile(r"^(curl|wget|python-requests|urllib|aiohttp|scrapy|go-http-client|java/|libwww-perl|mechanize)", re.IGNORECASE),
    # Exploit and penetration testing scanners
    re.compile(r"(sqlmap|nikto|wpscan|gobuster|dirbuster|nmap|masscan|zgrab|censys|shodan)", re.IGNORECASE),
    # Headless scraping automation tools
    re.compile(r"(headlesschrome|phantomjs|selenium|puppeteer|playwright)", re.IGNORECASE),
]

# Sensitive endpoints targeted by scrapers for mass data extraction
SCRAPING_TARGET_ENDPOINTS = (
    "/api/v1/jobs",
    "/api/v1/admin/users",
    "/api/v1/applications",
    "/api/v1/interviews",
)


class HighFrequencyScraperTracker:
    """Tracks rapid data scraping requests per client IP to prevent bulk harvesting."""

    def __init__(self, threshold: int = 12, window_seconds: int = 10):
        self.threshold = threshold
        self.window_seconds = window_seconds
        self._history: Dict[str, List[float]] = defaultdict(list)

    def is_burst_scraping(self, client_ip: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds
        timestamps = [ts for ts in self._history[client_ip] if ts > cutoff]
        timestamps.append(now)
        self._history[client_ip] = timestamps
        return len(timestamps) >= self.threshold


class HighFrequency404Tracker:
    """Tracks rapid 404 errors per IP to detect automated directory fuzzers and scanners."""

    def __init__(self, threshold: int = 15, window_seconds: int = 60):
        self.threshold = threshold
        self.window_seconds = window_seconds
        self._history: Dict[str, List[float]] = defaultdict(list)
        self._alerted_ips: Dict[str, float] = {}

    def record_404(self, client_ip: str, path: str, user_agent: str):
        now = time.time()
        cutoff = now - self.window_seconds
        timestamps = [ts for ts in self._history[client_ip] if ts > cutoff]
        timestamps.append(now)
        self._history[client_ip] = timestamps

        if len(timestamps) >= self.threshold:
            # Don't spam alert more than once every 5 minutes per IP
            last_alert = self._alerted_ips.get(client_ip, 0)
            if now - last_alert > 300:
                self._alerted_ips[client_ip] = now
                security_logger.log_event(
                    event_type=SecurityEventType.HIGH_FREQUENCY_404_SCANNER,
                    severity="CRITICAL",
                    client_ip=client_ip,
                    user_agent=user_agent,
                    endpoint=path,
                    details={
                        "404_count_in_window": len(timestamps),
                        "window_seconds": self.window_seconds,
                        "action": "Flagged potential automated directory scanner / crawler fuzzing",
                    },
                )


tracker_404 = HighFrequency404Tracker()
scraper_tracker = HighFrequencyScraperTracker()


class TrafficMonitorMiddleware(BaseHTTPMiddleware):
    """
    Analyzes incoming request paths, queries, user-agents, and response statuses in real time.
    Enforces abuse protection against:
    1. Automated bots, headless scrapers, and scanner tools
    2. Path traversal and sensitive file probes
    3. Malicious query injection (SQLi / XSS)
    4. Burst data scraping on sensitive listing endpoints
    5. High-frequency 404 directory fuzzing
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        client_ip = get_client_ip(request)
        user_agent = request.headers.get("User-Agent", "unknown")
        raw_path = request.url.path
        raw_query = str(request.url.query)

        # Allow bypass during unit/integration tests unless specifically testing bot / scraper blocks
        is_test_env = getattr(request.app.state, "disable_rate_limiting", False)
        test_bot_block = request.headers.get("X-Test-Bot-Block") == "true"
        test_scraper_block = request.headers.get("X-Test-Scraper-Check") == "true"

        # Infrastructure probes, root health checks, and HEAD/OPTIONS requests must never be blocked as bots
        is_infra_path = (
            raw_path in ("/", "/health", "/favicon.ico", "/robots.txt")
            or raw_path.startswith(("/docs", "/openapi", "/redoc"))
            or raw_path.endswith("/health")
            or request.method in ("HEAD", "OPTIONS")
        )

        # 1. Bot & Automated Scraper Detection
        if not is_infra_path and (not is_test_env or test_bot_block):
            is_bot = False
            matched_agent = ""

            for pattern in KNOWN_BOT_USER_AGENTS:
                if pattern.search(user_agent):
                    is_bot = True
                    matched_agent = pattern.pattern
                    break

            # In production or test-check mode, also flag blank or suspiciously short user agents on API routes
            if not is_bot and (settings.ENVIRONMENT == "production" or test_bot_block):
                if raw_path.startswith("/api/") and (user_agent == "unknown" or len(user_agent.strip()) < 5):
                    is_bot = True
                    matched_agent = "EMPTY_OR_ANONYMOUS_USER_AGENT"

            if is_bot:
                logger.warning(f"Blocked automated bot/scraper: ip={client_ip} ua='{user_agent}' path={raw_path}")
                security_logger.log_event(
                    event_type=SecurityEventType.BOT_DETECTED,
                    severity="WARNING",
                    client_ip=client_ip,
                    user_agent=user_agent,
                    endpoint=raw_path,
                    method=request.method,
                    details={
                        "signature_matched": matched_agent,
                        "action": "BLOCKED_BOT_REQUEST",
                    },
                )
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": {
                            "code": "BOT_ACCESS_DENIED",
                            "message": "Automated access detected and restricted. Please use an authorized browser or application.",
                        }
                    },
                )

        # 2. Anti-Scraping Burst Detection on Data Endpoints
        if raw_path.startswith(SCRAPING_TARGET_ENDPOINTS) and request.method == "GET":
            if not is_test_env or test_scraper_block:
                if scraper_tracker.is_burst_scraping(client_ip):
                    logger.warning(f"Data scraping burst detected from IP {client_ip} on {raw_path}")
                    security_logger.log_event(
                        event_type=SecurityEventType.DATA_SCRAPING_DETECTED,
                        severity="WARNING",
                        client_ip=client_ip,
                        user_agent=user_agent,
                        endpoint=raw_path,
                        method=request.method,
                        details={
                            "action": "THROTTLED_HIGH_FREQUENCY_SCRAPER",
                            "threshold": scraper_tracker.threshold,
                            "window_seconds": scraper_tracker.window_seconds,
                        },
                    )
                    return JSONResponse(
                        status_code=429,
                        content={
                            "error": {
                                "code": "DATA_SCRAPING_DETECTED",
                                "message": "High-frequency data scraping detected. Please slow down and respect data access limits.",
                                "retry_after_seconds": 30,
                            }
                        },
                        headers={"Retry-After": "30"},
                    )

        # Decode path and query for payload analysis
        decoded_path = unquote(raw_path)
        decoded_query = unquote(raw_query)

        # 3. Path Anomaly & Traversal Inspection
        for pattern in SUSPICIOUS_PATH_PATTERNS:
            if pattern.search(decoded_path):
                security_logger.log_event(
                    event_type=SecurityEventType.SUSPICIOUS_TRAFFIC,
                    severity="WARNING",
                    client_ip=client_ip,
                    user_agent=user_agent,
                    endpoint=raw_path,
                    method=request.method,
                    details={
                        "pattern_matched": pattern.pattern,
                        "raw_path": raw_path,
                        "action": "BLOCKED_SUSPICIOUS_PATH",
                    },
                )
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": {
                            "code": "SUSPICIOUS_REQUEST_BLOCKED",
                            "message": "Access denied due to suspicious request pattern.",
                        }
                    },
                )

        # 4. Query String Injection Inspection
        if decoded_query:
            for pattern in SUSPICIOUS_QUERY_PATTERNS:
                if pattern.search(decoded_query):
                    security_logger.log_event(
                        event_type=SecurityEventType.SUSPICIOUS_PAYLOAD,
                        severity="WARNING",
                        client_ip=client_ip,
                        user_agent=user_agent,
                        endpoint=raw_path,
                        method=request.method,
                        details={
                            "pattern_matched": pattern.pattern,
                            "query": decoded_query[:100],
                            "action": "BLOCKED_MALICIOUS_QUERY",
                        },
                    )
                    return JSONResponse(
                        status_code=400,
                        content={
                            "error": {
                                "code": "MALICIOUS_PAYLOAD_DETECTED",
                                "message": "Malformed or disallowed characters in request query.",
                            }
                        },
                    )

        # Execute downstream handlers
        response = await call_next(request)

        # 5. Monitor for 404 scanning behavior
        if response.status_code == 404 and not raw_path.startswith(("/docs", "/openapi", "/redoc", "/favicon")):
            tracker_404.record_404(client_ip=client_ip, path=raw_path, user_agent=user_agent)

        return response
