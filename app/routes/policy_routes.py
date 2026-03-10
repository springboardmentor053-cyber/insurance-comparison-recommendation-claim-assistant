"""
Policy Routes – Browse, filter, purchase, view and cancel insurance policies.
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from datetime import date, timedelta
import random
import string

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user
from app.schemas import PremiumCalculationRequest
from app.services.premium import calculate_premium


router = APIRouter(prefix="/policies", tags=["Policies"])


# ─────────────────── LIST POLICIES ───────────────────
@router.get("/", response_model=List[schemas.PolicyResponse])
def list_policies(
    policy_type: Optional[str] = Query(None, description="Filter by type"),
    db: Session = Depends(get_db),
):
    query = db.query(models.Policy).options(joinedload(models.Policy.provider))

    if policy_type:
        query = query.filter(models.Policy.policy_type == policy_type.lower())

    return query.order_by(models.Policy.premium.asc()).all()


# ─────────────────── MY PURCHASED POLICIES ───────────────────
@router.get("/my", response_model=List[schemas.UserPolicyResponse])
def get_my_policies(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_policies = (
        db.query(models.UserPolicy)
        .options(
            joinedload(models.UserPolicy.policy)
            .joinedload(models.Policy.provider)
        )
        .filter(models.UserPolicy.user_id == current_user.id)
        .order_by(models.UserPolicy.start_date.desc())
        .all()
    )

    return user_policies


# ─────────────────── GET SINGLE POLICY ───────────────────
@router.get("/{policy_id}", response_model=schemas.PolicyResponse)
def get_policy(
    policy_id: int,
    db: Session = Depends(get_db),
):
    policy = (
        db.query(models.Policy)
        .options(joinedload(models.Policy.provider))
        .filter(models.Policy.id == policy_id)
        .first()
    )

    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )

    return policy


# ─────────────────── BUY POLICY ───────────────────
@router.post("/buy/{policy_id}", response_model=schemas.MessageResponse)
def buy_policy(
    policy_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    policy = db.query(models.Policy).filter(models.Policy.id == policy_id).first()

    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )

    policy_number = "POL" + ''.join(random.choices(string.digits, k=6))

    start_date = date.today()
    end_date = start_date + timedelta(days=policy.term_months * 30)

    user_policy = models.UserPolicy(
        user_id=current_user.id,
        policy_id=policy.id,
        policy_number=policy_number,
        start_date=start_date,
        end_date=end_date,
        premium=policy.premium,
        status="active",
        auto_renew=False
    )

    db.add(user_policy)
    db.commit()

    return schemas.MessageResponse(
        message="Policy purchased successfully"
    )


# ─────────────────── CANCEL POLICY ───────────────────
@router.put("/cancel/{user_policy_id}", response_model=schemas.MessageResponse)
def cancel_policy(
    user_policy_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_policy = (
        db.query(models.UserPolicy)
        .filter(
            models.UserPolicy.id == user_policy_id,
            models.UserPolicy.user_id == current_user.id
        )
        .first()
    )

    if not user_policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )

    if user_policy.status != "active":
        return schemas.MessageResponse(
            message="Policy is already expired or cancelled"
        )

    user_policy.status = "cancelled"
    db.commit()

    return schemas.MessageResponse(
        message="Policy cancelled successfully"
    )


# ─────────────────── PREMIUM CALCULATOR ───────────────────
@router.post("/calculate")
def calculate_policy_premium(
    data: PremiumCalculationRequest,
    db: Session = Depends(get_db)
):
    policy = db.query(models.Policy).filter(models.Policy.id == data.policy_id).first()

    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    final_premium = calculate_premium(
        base_premium=float(policy.premium),
        age=data.age,
        coverage_amount=data.coverage_amount,
        term_months=data.term_months,
        risk_factor=data.risk_factor
    )

    return {
        "policy_id": policy.id,
        "base_premium": policy.premium,
        "calculated_premium": final_premium
    }
