"""
Token Blacklist — Refresh Token Revocation
==========================================
Primary store: Redis (with TTL auto-expiry matching token lifetime).
Fallback store: Thread-safe in-memory dict (for environments without Redis).

On logout, the refresh token SHA-256 hash is stored.
On /refresh, the token is checked against the blacklist before being accepted.
"""

import hashlib
import time
import logging
import threading
from typing import Optional

logger = logging.getLogger("app.security.token_blacklist")

# ---------------------------------------------------------------------------
# In-Memory Fallback Store
# ---------------------------------------------------------------------------
_memory_blacklist: dict = {}  # token_hash -> expiry_timestamp (float)
_memory_lock = threading.Lock()


def _memory_add(token_hash: str, ttl_seconds: int) -> None:
    with _memory_lock:
        expiry = time.time() + ttl_seconds
        _memory_blacklist[token_hash] = expiry
        # Opportunistic cleanup of expired entries
        now = time.time()
        expired_keys = [k for k, exp in list(_memory_blacklist.items()) if exp <= now]
        for k in expired_keys:
            del _memory_blacklist[k]


def _memory_check(token_hash: str) -> bool:
    with _memory_lock:
        expiry = _memory_blacklist.get(token_hash)
        if expiry is None:
            return False
        if time.time() > expiry:
            del _memory_blacklist[token_hash]
            return False
        return True


# ---------------------------------------------------------------------------
# Redis Client (lazy singleton)
# ---------------------------------------------------------------------------
_redis_client = None
_redis_available: Optional[bool] = None  # None=untested, True=ok, False=down


def _get_redis():
    global _redis_client, _redis_available
    if _redis_available is False:
        return None
    if _redis_client is not None:
        return _redis_client
    try:
        from app.core.config import settings
        import redis as _redis_lib
        client = _redis_lib.Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=2,
        )
        client.ping()
        _redis_client = client
        _redis_available = True
        logger.info("Token blacklist: Redis connected at %s", settings.REDIS_URL)
        return _redis_client
    except Exception as e:
        _redis_available = False
        logger.info("Token blacklist: Redis not configured — using in-memory fallback. (Reason: %s)", e)
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

_PREFIX = "blk:"


def _hash(token: str) -> str:
    """SHA-256 hash of the token — never store raw token strings."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def blacklist_token(token: str, ttl_seconds: int) -> None:
    """
    Revoke a refresh token. Call this on logout.

    Args:
        token: Raw refresh token string.
        ttl_seconds: Blacklist TTL (should match remaining token lifetime).
    """
    h = _hash(token)
    r = _get_redis()
    if r:
        try:
            r.setex(f"{_PREFIX}{h}", ttl_seconds, "1")
            logger.debug("Token blacklisted in Redis (hash=%.12s, ttl=%ds)", h, ttl_seconds)
            return
        except Exception as e:
            logger.warning("Redis blacklist write failed: %s. Falling back to memory.", e)
    _memory_add(h, ttl_seconds)
    logger.debug("Token blacklisted in memory (hash=%.12s, ttl=%ds)", h, ttl_seconds)


def is_blacklisted(token: str) -> bool:
    """
    Returns True if the token has been explicitly revoked.
    Call this on every /refresh request before accepting the token.

    Args:
        token: Raw refresh token string.
    """
    h = _hash(token)
    r = _get_redis()
    if r:
        try:
            return bool(r.exists(f"{_PREFIX}{h}"))
        except Exception as e:
            logger.warning("Redis blacklist check failed: %s. Falling back to memory.", e)
    return _memory_check(h)
