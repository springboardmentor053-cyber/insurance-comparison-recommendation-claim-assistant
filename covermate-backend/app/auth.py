from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
import os

# ─────────────────── Password Hashing ───────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ─────────────────── JWT Settings ───────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "SECRET_KEY_CHANGE_LATER")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7


# ─────────────────── Access Token ───────────────────
def create_access_token(data: dict) -> str:
    """
    Create a short-lived JWT access token (30 min).
    The token payload contains the user id in the 'sub' field
    and a 'type' field set to 'access'.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ─────────────────── Refresh Token ───────────────────
def create_refresh_token(data: dict) -> str:
    """
    Create a long-lived JWT refresh token (7 days).
    Used to obtain new access tokens without re-entering credentials.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_refresh_token(token: str) -> dict:
    """
    Decode and validate a refresh token.
    Returns the payload if valid, raises ValueError otherwise.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise ValueError("Token is not a refresh token")
        return payload
    except JWTError:
        raise ValueError("Invalid or expired refresh token")
