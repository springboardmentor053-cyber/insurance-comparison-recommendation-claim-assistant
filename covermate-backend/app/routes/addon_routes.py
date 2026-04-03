"""
Add-on Routes — Policy add-ons/riders catalog and user selections.

Endpoints:
    GET    /policies/{policy_id}/addons          → List available add-ons for a policy
    POST   /user-policies/{id}/addons            → Attach an add-on to user's enrolled policy
    DELETE /user-policies/{id}/addons/{addon_id} → Remove an add-on
    GET    /user-policies/{id}/addons            → List user's selected add-ons
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user

router = APIRouter(tags=["Add-ons & Riders"])


# ─────────────────── LIST AVAILABLE ADD-ONS FOR A POLICY ───────────────────
@router.get("/policies/{policy_id}/addons", response_model=List[schemas.PolicyAddonResponse])
def list_policy_addons(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return all active add-ons available for a given policy."""
    policy = db.query(models.Policy).filter(models.Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    return (
        db.query(models.PolicyAddon)
        .filter(
            models.PolicyAddon.policy_id == policy_id,
            models.PolicyAddon.is_active == True,
        )
        .all()
    )


# ─────────────────── GET USER'S SELECTED ADD-ONS ───────────────────
@router.get("/user-policies/{user_policy_id}/addons", response_model=List[schemas.UserPolicyAddonResponse])
def get_my_addons(
    user_policy_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return add-ons currently selected for one of the user's enrolled policies."""
    up = db.query(models.UserPolicy).filter(
        models.UserPolicy.id == user_policy_id,
        models.UserPolicy.user_id == current_user.id,
    ).first()
    if not up:
        raise HTTPException(status_code=404, detail="Enrolled policy not found")

    return (
        db.query(models.UserPolicyAddon)
        .options(joinedload(models.UserPolicyAddon.addon))
        .filter(models.UserPolicyAddon.user_policy_id == user_policy_id)
        .all()
    )


# ─────────────────── ATTACH AN ADD-ON ───────────────────
@router.post("/user-policies/{user_policy_id}/addons", response_model=schemas.UserPolicyAddonResponse, status_code=201)
def add_addon(
    user_policy_id: int,
    body: schemas.UserPolicyAddonCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Attach an add-on rider to the user's enrolled policy."""
    up = db.query(models.UserPolicy).filter(
        models.UserPolicy.id == user_policy_id,
        models.UserPolicy.user_id == current_user.id,
    ).first()
    if not up:
        raise HTTPException(status_code=404, detail="Enrolled policy not found")

    addon = db.query(models.PolicyAddon).filter(
        models.PolicyAddon.id == body.addon_id,
        models.PolicyAddon.policy_id == up.policy_id,
        models.PolicyAddon.is_active == True,
    ).first()
    if not addon:
        raise HTTPException(status_code=404, detail="Add-on not found or not available for this policy")

    # Prevent duplicate selection
    existing = db.query(models.UserPolicyAddon).filter(
        models.UserPolicyAddon.user_policy_id == user_policy_id,
        models.UserPolicyAddon.addon_id == body.addon_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Add-on already selected")

    selection = models.UserPolicyAddon(
        user_policy_id=user_policy_id,
        addon_id=body.addon_id,
    )
    db.add(selection)
    db.commit()
    db.refresh(selection)

    return (
        db.query(models.UserPolicyAddon)
        .options(joinedload(models.UserPolicyAddon.addon))
        .filter(models.UserPolicyAddon.id == selection.id)
        .first()
    )


# ─────────────────── REMOVE AN ADD-ON ───────────────────
@router.delete("/user-policies/{user_policy_id}/addons/{addon_id}")
def remove_addon(
    user_policy_id: int,
    addon_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Remove an add-on from the user's enrolled policy."""
    up = db.query(models.UserPolicy).filter(
        models.UserPolicy.id == user_policy_id,
        models.UserPolicy.user_id == current_user.id,
    ).first()
    if not up:
        raise HTTPException(status_code=404, detail="Enrolled policy not found")

    selection = db.query(models.UserPolicyAddon).filter(
        models.UserPolicyAddon.user_policy_id == user_policy_id,
        models.UserPolicyAddon.addon_id == addon_id,
    ).first()
    if not selection:
        raise HTTPException(status_code=404, detail="Add-on not found in this policy")

    db.delete(selection)
    db.commit()
    return {"message": "Add-on removed successfully"}
