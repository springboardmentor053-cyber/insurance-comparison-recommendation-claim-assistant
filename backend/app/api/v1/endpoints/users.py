from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.core import security
from app.crud import crud_user

router = APIRouter()


@router.get("/me", response_model=schemas.User)
def read_user_me(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Get current user."""
    return current_user


@router.put("/me/profile", response_model=schemas.User)
def update_profile(
    *,
    db: Session = Depends(deps.get_db),
    profile_in: schemas.RiskProfileUpdate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Update the current user's risk profile fields.
    Only provided fields are updated; existing fields are preserved.
    Also clears cached recommendations so they are regenerated on next visit.
    """
    updated_user = crud_user.update_risk_profile(db, user=current_user, profile_in=profile_in)

    # Invalidate cached recommendations so Engine reruns with new profile data
    db.query(models.Recommendation).filter(
        models.Recommendation.user_id == current_user.id
    ).delete()
    db.commit()

    return updated_user


@router.put("/me/password", response_model=schemas.User)
def update_password(
    *,
    db: Session = Depends(deps.get_db),
    password_in: schemas.UserUpdatePassword,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Update own password."""
    if not security.verify_password(password_in.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    if password_in.new_password != password_in.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")

    hashed_password = security.get_password_hash(password_in.new_password)
    current_user.password = hashed_password
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
