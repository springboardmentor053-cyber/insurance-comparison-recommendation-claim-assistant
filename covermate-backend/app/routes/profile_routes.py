"""
Profile Routes – View / update profile and risk preferences.

These endpoints let the authenticated user manage their personal
information and insurance preferences. They are mounted under the
/profile prefix in main.py.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user

router = APIRouter(prefix="/profile", tags=["Profile & Preferences"])


# ─────────────────── GET PROFILE ───────────────────
@router.get("/", response_model=schemas.UserResponse)
def get_profile(
    current_user: models.User = Depends(get_current_user),
):
    return current_user


# ─────────────────── UPDATE PROFILE ───────────────────
@router.put("/", response_model=schemas.UserResponse)
def update_profile(
    body: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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
    current_user.risk_profile = body.risk_profile
    db.commit()

    return schemas.MessageResponse(
        message="Risk profile updated successfully"
    )


# ─────────────────── GENERATE RECOMMENDATIONS ───────────────────
# ─────────────────── GENERATE RECOMMENDATIONS ───────────────────
@router.post("/generate-recommendations", response_model=schemas.MessageResponse)
def generate_recommendations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate personalized policy recommendations
    based on user's stored risk profile.
    """

    if not current_user.risk_profile:
        return schemas.MessageResponse(
            message="Please complete risk profile first."
        )

    profile = current_user.risk_profile

    # Remove old recommendations
    db.query(models.Recommendation).filter(
        models.Recommendation.user_id == current_user.id
    ).delete()

    policies = db.query(models.Policy).all()

    for policy in policies:

        score = 0
        reasons = []

        # ───── Weights ─────
        coverage_weight = 40
        budget_weight = 35
        risk_weight = 25

        # ───── Coverage Match ─────
        coverage_match = 0
        if profile.get("preferred_types") and policy.policy_type in profile.get("preferred_types"):
            coverage_match = 1
            reasons.append("Matches preferred policy type")

        # ───── Premium Match ─────
        premium_match = 0
        if profile.get("budget_limit") and float(policy.premium) <= float(profile.get("budget_limit")):
            premium_match = 1
            reasons.append("Within budget")

        # ───── Deductible Match ─────
        deductible_match = 0
        if profile.get("risk_appetite") == "low" and policy.deductible and float(policy.deductible) < 1000:
            deductible_match = 1
            reasons.append("Low deductible preferred")

        elif profile.get("risk_appetite") == "high" and policy.deductible and float(policy.deductible) >= 1000:
            deductible_match = 1
            reasons.append("Higher deductible acceptable")

        # ───── Final Score ─────
        score = (
            coverage_weight * coverage_match +
            budget_weight * premium_match +
            risk_weight * deductible_match
        )

        # Create recommendation
        recommendation = models.Recommendation(
            user_id=current_user.id,
            policy_id=policy.id,
            score=score,
            reason=", ".join(reasons),
        )

        db.add(recommendation)

    db.commit()

    return schemas.MessageResponse(
        message="Recommendations generated successfully"
    )
# ─────────────────── GET TOP 3 RECOMMENDATIONS ───────────────────
@router.get("/recommendations/top")
def get_top_recommendations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return top 3 highest scored recommendations.
    """

    recommendations = (
        db.query(models.Recommendation)
        .filter(models.Recommendation.user_id == current_user.id)
        .order_by(desc(models.Recommendation.score))
        .limit(3)
        .all()
    )

    result = []

    for rec in recommendations:
        result.append({
            "id": rec.id,
            "policy_id": rec.policy_id,
            "score": float(rec.score),
            "reason": rec.reason,
            "created_at": rec.created_at,
            "policy": {
                "title": rec.policy.title,
                "policy_type": rec.policy.policy_type,
                "premium": float(rec.policy.premium)
            }
        })

    return result