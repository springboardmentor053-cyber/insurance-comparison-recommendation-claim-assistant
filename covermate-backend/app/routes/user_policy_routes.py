"""
User Policy Routes – Enroll, list, view, and cancel user policies.

Endpoints:
    POST   /user-policies/        → Enroll in a policy
    GET    /user-policies/        → List my enrolled policies
    GET    /user-policies/{id}    → Get a single enrolled policy
    DELETE /user-policies/{id}    → Cancel a policy
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import date
from dateutil.relativedelta import relativedelta
import uuid

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user

router = APIRouter(prefix="/user-policies", tags=["My Policies"])


def _generate_policy_number(user_id: int, policy_id: int) -> str:
    """Generate a unique policy number like CM-3-7-A1B2."""
    suffix = uuid.uuid4().hex[:4].upper()
    return f"CM-{user_id}-{policy_id}-{suffix}"


# ─────────────────── ENROLL IN A POLICY ───────────────────
@router.post("/", response_model=schemas.UserPolicyResponse, status_code=201)
def enroll_policy(
    body: schemas.UserPolicyCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Enroll the authenticated user in a policy.

    - Validates the policy exists.
    - Prevents duplicate active enrollment in the same policy.
    - Auto-generates a policy number, start date (today), and end date
      (today + term_months from the policy).
    """
    # 1 — Verify policy exists
    policy = db.query(models.Policy).filter(models.Policy.id == body.policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    # 2 — Check for existing active enrollment
    existing = (
        db.query(models.UserPolicy)
        .filter(
            models.UserPolicy.user_id == current_user.id,
            models.UserPolicy.policy_id == body.policy_id,
            models.UserPolicy.status == "active",
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You are already enrolled in this policy",
        )

    # 3 — Create enrollment
    today = date.today()
    term = policy.term_months or 12
    end = today + relativedelta(months=term)

    user_policy = models.UserPolicy(
        user_id=current_user.id,
        policy_id=body.policy_id,
        policy_number=_generate_policy_number(current_user.id, body.policy_id),
        start_date=today,
        end_date=end,
        premium=float(policy.premium),
        status="active",
        auto_renew=False,
    )
    db.add(user_policy)
    db.commit()
    db.refresh(user_policy)

    # Eager-load the policy relationship for the response
    user_policy = (
        db.query(models.UserPolicy)
        .options(joinedload(models.UserPolicy.policy).joinedload(models.Policy.provider))
        .filter(models.UserPolicy.id == user_policy.id)
        .first()
    )
    return user_policy


# ─────────────────── LIST MY POLICIES ───────────────────
@router.get("/", response_model=List[schemas.UserPolicyResponse])
def list_my_policies(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all policies the authenticated user has enrolled in."""
    return (
        db.query(models.UserPolicy)
        .options(joinedload(models.UserPolicy.policy).joinedload(models.Policy.provider))
        .filter(models.UserPolicy.user_id == current_user.id)
        .order_by(models.UserPolicy.id.desc())
        .all()
    )


# ─────────────────── GET SINGLE USER POLICY ───────────────────
@router.get("/{user_policy_id}", response_model=schemas.UserPolicyResponse)
def get_my_policy(
    user_policy_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get details of a specific enrolled policy (must belong to the current user)."""
    up = (
        db.query(models.UserPolicy)
        .options(joinedload(models.UserPolicy.policy).joinedload(models.Policy.provider))
        .filter(
            models.UserPolicy.id == user_policy_id,
            models.UserPolicy.user_id == current_user.id,
        )
        .first()
    )
    if not up:
        raise HTTPException(status_code=404, detail="Enrolled policy not found")
    return up


# ─────────────────── CANCEL A POLICY ───────────────────
@router.delete("/{user_policy_id}", response_model=schemas.MessageResponse)
def cancel_policy(
    user_policy_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cancel an active policy enrollment.

    Only the owner can cancel their own policy.
    Status changes from 'active' → 'cancelled'.
    """
    up = (
        db.query(models.UserPolicy)
        .filter(
            models.UserPolicy.id == user_policy_id,
            models.UserPolicy.user_id == current_user.id,
        )
        .first()
    )
    if not up:
        raise HTTPException(status_code=404, detail="Enrolled policy not found")

    if up.status == "cancelled":
        raise HTTPException(status_code=400, detail="Policy is already cancelled")

    up.status = "cancelled"
    db.commit()

    return schemas.MessageResponse(message="Policy cancelled successfully")
