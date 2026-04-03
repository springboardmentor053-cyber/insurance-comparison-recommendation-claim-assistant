"""
Auth Routes – Register, Login, Refresh Token, Me, Change Password.

These endpoints handle everything related to authentication and account
security.  They are mounted under the  /auth  prefix in main.py.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, verify_refresh_token,
)
from app.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ─────────────────── REGISTER ───────────────────
@router.post("/register", response_model=schemas.TokenResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user account.

    Steps:
      1. Check if the email is already taken.
      2. Hash the password (never store plain text!).
      3. Insert a new User row.
      4. Return both access + refresh JWT tokens so the user is
         automatically logged in after registration.
    """
    # 1 — Check for duplicate email
    existing = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # 2 — Create the user with hashed password
    new_user = models.User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        dob=user.dob,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 3 — Generate tokens
    token_data = {"sub": str(new_user.id)}
    return schemas.TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


# ─────────────────── LOGIN ───────────────────
@router.post("/login", response_model=schemas.TokenResponse)
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate with email + password and receive JWT tokens.

    The access_token is short-lived (30 min) and used for API calls.
    The refresh_token is long-lived (7 days) and used to get new
    access_tokens without re-entering credentials.
    """
    db_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token_data = {"sub": str(db_user.id)}
    return schemas.TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


# ─────────────────── REFRESH TOKEN ───────────────────
@router.post("/refresh", response_model=schemas.TokenResponse)
def refresh_token(body: schemas.RefreshRequest, db: Session = Depends(get_db)):
    """
    Exchange a valid refresh token for a new pair of tokens.

    This lets the frontend silently renew the session when the
    access_token expires, without asking the user to log in again.
    """
    try:
        payload = verify_refresh_token(body.refresh_token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    user_id = payload.get("sub")

    # Make sure the user still exists
    user = db.query(models.User).filter(
        models.User.id == int(user_id)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    token_data = {"sub": str(user.id)}
    return schemas.TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


# ─────────────────── ME (current user) ───────────────────
@router.get("/me", response_model=schemas.UserResponse)
def read_current_user(
    current_user: models.User = Depends(get_current_user),
):
    """Return the profile of the currently authenticated user."""
    return current_user


# ─────────────────── CHANGE PASSWORD ───────────────────
@router.put("/change-password", response_model=schemas.MessageResponse)
def change_password(
    body: schemas.PasswordChange,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Change the current user's password.

    Requires the old password for verification (prevents someone who
    stole the access token from silently changing the password).
    """
    if not verify_password(body.old_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Old password is incorrect"
        )

    current_user.password = hash_password(body.new_password)
    db.commit()

    return schemas.MessageResponse(message="Password changed successfully")
