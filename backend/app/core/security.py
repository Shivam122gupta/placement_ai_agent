import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import jwt
import bcrypt
from app.core.config import settings

# Pre-computed dummy hash for constant-time login verification (mitigates user enumeration timing attacks)
DUMMY_BCRYPT_HASH = "$2b$12$e80yvV83y810m2c07YqX0O3F4Oa1x7r2G84F6O0q4O5M6K7L8I9J."


def hash_token(token: str) -> str:
    """
    Returns a deterministic SHA-256 hash of a sensitive token.
    Raw tokens are emailed to the user, while only this hash is persisted in the database.
    """
    if not token:
        return ""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_secure_token() -> str:
    """Generates a cryptographically strong, URL-safe random token (32 bytes / 256 bits of entropy)."""
    return secrets.token_urlsafe(32)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against a bcrypt hash.
    Supports both direct bcrypt hashes and SHA-256 pre-hashed inputs for backward compatibility.
    """
    try:
        pwd_bytes = plain_password.encode("utf-8")
        # Bcrypt has a hard limit of 72 bytes. Check direct slice first.
        hash_bytes = hashed_password.encode("utf-8")
        if bcrypt.checkpw(pwd_bytes[:72], hash_bytes):
            return True

        # Check sha256 pre-hashed variant (for long passwords >72 bytes)
        prehash = hashlib.sha256(pwd_bytes).hexdigest().encode("utf-8")
        return bcrypt.checkpw(prehash, hash_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """
    Generates a secure bcrypt password hash with work factor 12.
    For passwords longer than 72 bytes, pre-hashes with SHA-256 to prevent silent truncation.
    """
    pwd_bytes = password.encode("utf-8")
    if len(pwd_bytes) > 72:
        pwd_bytes = hashlib.sha256(pwd_bytes).hexdigest().encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def constant_time_dummy_verify(password: str) -> None:
    """
    Executes a dummy bcrypt check against a constant hash.
    Used when a user is not found to normalize execution time and eliminate timing attacks.
    """
    try:
        verify_password(password, DUMMY_BCRYPT_HASH)
    except Exception:
        pass


def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
    token_version: int = 1,
) -> str:
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "exp": expire,
        "iat": now,
        "type": "access",
        "ver": token_version,
    }
    if extra_claims:
        to_encode.update(extra_claims)
        
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    token_version: int = 1,
) -> str:
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "exp": expire,
        "iat": now,
        "type": "refresh",
        "ver": token_version,
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_REFRESH_SECRET, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])


def decode_refresh_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, settings.JWT_REFRESH_SECRET, algorithms=[settings.ALGORITHM])

