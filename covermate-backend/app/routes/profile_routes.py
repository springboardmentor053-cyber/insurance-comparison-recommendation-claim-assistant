"""
Profile Routes – View / update profile and risk preferences.

These endpoints let the authenticated user manage their personal
information and insurance preferences.  They are mounted under the
/profile  prefix in main.py.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user

router = APIRouter(prefix="/profile", tags=["Profile & Preferences"])


# ─────────────────── GET PROFILE ───────────────────
@router.get("/", response_model=schemas.UserResponse)
def get_profile(
    current_user: models.User = Depends(get_current_user),
):
    """Return the full profile of the authenticated user."""
    return current_user


# ─────────────────── UPDATE PROFILE ───────────────────
@router.put("/", response_model=schemas.UserResponse)
def update_profile(
    body: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update basic profile fields (name, dob).

    Only the fields you send will be updated.  For example, if you send
    {"name": "New Name"} without dob, only the name changes.
    """
    if body.name is not None:
        current_user.name = body.name
    if body.dob is not None:
        current_user.dob = body.dob

    db.commit()
    db.refresh(current_user)
    return current_user


# ─────────────────── GET RISK PROFILE ───────────────────
@router.get("/risk-profile")
def get_risk_profile(
    current_user: models.User = Depends(get_current_user),
):
    """
    Return the user's risk profile (insurance preferences).

    The risk_profile is a flexible JSON object.  If the user hasn't
    filled it out yet, this returns null.
    """
    return {
        "user_id": current_user.id,
        "risk_profile": current_user.risk_profile,
    }


# ─────────────────── UPDATE RISK PROFILE ───────────────────
@router.put("/risk-profile", response_model=schemas.MessageResponse)
def update_risk_profile(
    body: schemas.RiskProfileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Store or update the user's risk profile / preferences.

    This data is later used by the Recommendation Engine (Module C)
    to score and rank policies for the user.

    Example body:
    {
        "risk_profile": {
            "age_group": "25-35",
            "smoker": false,
            "income_bracket": "5-10L",
            "has_dependents": true,
            "preferred_types": ["health", "life"]
        }
    }
    """
    current_user.risk_profile = body.risk_profile
    db.commit()

    return schemas.MessageResponse(
        message="Risk profile updated successfully"
    )
