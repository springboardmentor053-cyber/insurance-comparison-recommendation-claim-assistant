"""
Policy Routes – Browse, filter, compare, and quote insurance policies.

Endpoints:
    GET  /policies/           → List all policies (optionally filter by type)
    GET  /policies/{id}       → Get a single policy by ID
    POST /policies/compare    → Compare 2–3 policies side-by-side
    GET  /policies/quote      → Calculate a premium quote for a policy
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/policies", tags=["Policies"])


@router.get("/", response_model=List[schemas.PolicyResponse])
def list_policies(
    policy_type: Optional[str] = Query(None, description="Filter by type: health, life, auto, home, travel"),
    db: Session = Depends(get_db),
):
    """
    Browse all available insurance policies.
    Optionally filter by policy_type (e.g. ?policy_type=health).
    """
    query = db.query(models.Policy).options(joinedload(models.Policy.provider))

    if policy_type:
        query = query.filter(models.Policy.policy_type == policy_type.lower())

    return query.order_by(models.Policy.premium.asc()).all()


# NOTE: /compare and /quote must be defined BEFORE /{policy_id} to avoid
# FastAPI treating "compare" and "quote" as integer IDs.

@router.post("/compare", response_model=List[schemas.PolicyResponse])
def compare_policies(
    body: schemas.CompareRequest,
    db: Session = Depends(get_db),
):
    """
    Compare 2–3 insurance policies side-by-side.

    Send a list of 2–3 policy IDs and receive the full details for each,
    in the same order, ready for a comparison table in the frontend.
    """
    if len(body.policy_ids) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide at least 2 policy IDs to compare",
        )
    if len(body.policy_ids) > 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can compare at most 3 policies at a time",
        )

    policies = (
        db.query(models.Policy)
        .options(joinedload(models.Policy.provider))
        .filter(models.Policy.id.in_(body.policy_ids))
        .all()
    )

    # Return in the same order as requested
    policy_map = {p.id: p for p in policies}
    ordered = [policy_map[pid] for pid in body.policy_ids if pid in policy_map]

    if len(ordered) < 2:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more policy IDs not found",
        )

    return ordered


@router.get("/quote", response_model=schemas.QuoteResponse)
def get_quote(
    policy_id: int = Query(..., description="ID of the policy to quote"),
    age: int = Query(..., ge=18, le=80, description="Applicant age (18–80)"),
    coverage_amount: Optional[float] = Query(None, description="Override coverage amount"),
    term_months: Optional[int] = Query(None, description="Override term in months"),
    db: Session = Depends(get_db),
):
    """
    Calculate an adjusted premium quote for a policy.

    Age-based adjustment rules:
      - Age 18–35 : no adjustment (0%)
      - Age 36–45 : +10%
      - Age 46–55 : +20%
      - Age 56–65 : +35%
      - Age 66+   : +50%
    """
    policy = (
        db.query(models.Policy)
        .options(joinedload(models.Policy.provider))
        .filter(models.Policy.id == policy_id)
        .first()
    )
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    base_premium = float(policy.premium)
    effective_term = term_months or policy.term_months or 12

    # Age adjustment
    if age <= 35:
        adj_pct = 0.0
    elif age <= 45:
        adj_pct = 10.0
    elif age <= 55:
        adj_pct = 20.0
    elif age <= 65:
        adj_pct = 35.0
    else:
        adj_pct = 50.0

    adjusted_premium = round(base_premium * (1 + adj_pct / 100), 2)
    total_cost = round(adjusted_premium * effective_term, 2)
    annual_cost = round(adjusted_premium * 12, 2)

    breakdown = {
        "base_premium_per_month": base_premium,
        "age_group": f"{age} years",
        "age_loading_percent": adj_pct,
        "adjusted_premium_per_month": adjusted_premium,
        "term_months": effective_term,
        "total_for_term": total_cost,
        "annual_equivalent": annual_cost,
    }
    if coverage_amount:
        breakdown["coverage_amount_override"] = coverage_amount

    return schemas.QuoteResponse(
        policy_id=policy.id,
        policy_title=policy.title,
        base_premium=base_premium,
        age_adjustment_pct=adj_pct,
        adjusted_premium=adjusted_premium,
        term_months=effective_term,
        total_cost=total_cost,
        annual_cost=annual_cost,
        breakdown=breakdown,
    )


@router.get("/{policy_id}", response_model=schemas.PolicyResponse)
def get_policy(
    policy_id: int,
    db: Session = Depends(get_db),
):
    """Get a single policy by its ID."""
    policy = (
        db.query(models.Policy)
        .options(joinedload(models.Policy.provider))
        .filter(models.Policy.id == policy_id)
        .first()
    )

    if not policy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found")

    return policy
