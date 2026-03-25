"""
Dependencies – Reusable dependency functions for FastAPI routes.

Dependencies are functions that FastAPI calls automatically before your
route handler runs.  They are injected via  Depends(...)  in the route
function signature.

The two dependencies here handle authentication:
  • get_current_user  – decodes the JWT access token from the
    Authorization header and returns the User object.
  • get_current_admin – same, but also checks that the user has
    role == "admin".
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import SECRET_KEY, ALGORITHM
from app import models

# OAuth2PasswordBearer tells FastAPI where the login endpoint is.
# The client sends:   Authorization: Bearer <token>
# FastAPI extracts <token> and passes it to our dependency.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """
    Decode the JWT access token and return the corresponding User.
    Raises 401 if token is invalid, expired, or user doesn't exist.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        # Reject refresh tokens being used as access tokens
        if payload.get("type") != "access":
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(
        models.User.id == int(user_id)
    ).first()

    if user is None:
        raise credentials_exception

    return user


def get_current_admin(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """
    Same as get_current_user but also checks that the user is an admin.
    Raises 403 Forbidden if not.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
