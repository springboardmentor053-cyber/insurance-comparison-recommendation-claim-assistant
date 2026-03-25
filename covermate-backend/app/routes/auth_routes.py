"""
Auth Routes – Register, Login, Refresh Token, Me, Change Password.

These endpoints handle everything related to authentication and account
security. They are mounted under the /auth prefix in main.py.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.database import get_db
from app import models, schemas
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
)
from app.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ─────────────────── REGISTER ───────────────────
@router.post("/register", response_model=schemas.TokenResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    new_user = models.User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        dob=user.dob,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token_data = {"sub": str(new_user.id)}

    return schemas.TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


# ─────────────────── LOGIN (UPDATED FOR OAUTH2) ───────────────────

# ─────────────────── LOGIN (JSON LOGIN) ───────────────────
# ─────────────────── LOGIN (JSON LOGIN) ───────────────────
# ─────────────────── LOGIN (OAUTH2) ───────────────────
@router.post("/login", response_model=schemas.TokenResponse)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    OAuth2 login for Swagger and frontend.
    Accepts username (email) and password as form data.
    """

    db_user = db.query(models.User).filter(
        models.User.email == form_data.username
    ).first()

    if not db_user or not verify_password(form_data.password, db_user.password):
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
    try:
        payload = verify_refresh_token(body.refresh_token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    user_id = payload.get("sub")

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


# ─────────────────── ME ───────────────────
@router.get("/me", response_model=schemas.UserResponse)
def read_current_user(
    current_user: models.User = Depends(get_current_user),
):
    return current_user


# ─────────────────── CHANGE PASSWORD ───────────────────
# ─────────────────── CHANGE PASSWORD ───────────────────
@router.put("/change-password", response_model=schemas.MessageResponse)
def change_password(
    body: schemas.PasswordChange,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify old password
    if not verify_password(body.old_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Old password is incorrect"
        )

    # Prevent same password reuse
    if body.old_password == body.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be same as old password"
        )

    # Update password
    current_user.password = hash_password(body.new_password)
    db.commit()

    return schemas.MessageResponse(message="Password changed successfully")
