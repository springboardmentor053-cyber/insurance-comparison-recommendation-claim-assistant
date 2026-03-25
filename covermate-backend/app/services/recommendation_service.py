"""
Recommendation Engine

Scores policies for a user based on their risk profile
and stores recommendations in the database.
"""

from sqlalchemy.orm import Session
from app import models


def score_policy(policy, profile):
    """
    Calculate score for a single policy based on user risk profile.
    """

    coverage_weight = 0.3
    budget_weight = 0.25
    risk_weight = 0.2
    type_weight = 0.15
    family_weight = 0.1

    reasons = []

    # Coverage priority
    coverage_match = 0.5
    if profile.get("coverage_priority") == "high":
        coverage_match = 1
        reasons.append("Matches high coverage preference")

    # Budget affordability
    budget_match = 0.5
    budget_limit = profile.get("budget_limit")

    if budget_limit and float(policy.premium) <= budget_limit:
        budget_match = 1
        reasons.append("Within your budget")

    # Risk appetite
    risk_match = 0.5
    if policy.deductible and float(policy.deductible) < 2000:
        risk_match = 1
        reasons.append("Low deductible risk")

    # Preferred policy type
    type_match = 0
    preferred_types = profile.get("preferred_types", [])

    if policy.type in preferred_types:
        type_match = 1
        reasons.append("Matches preferred policy type")

    # Family suitability
    family_match = 0.5
    if profile.get("family_size", 1) > 2:
        family_match = 1
        reasons.append("Suitable for family coverage")

    score = (
        coverage_weight * coverage_match +
        budget_weight * budget_match +
        risk_weight * risk_match +
        type_weight * type_match +
        family_weight * family_match
    )

    return score, ", ".join(reasons)


def generate_recommendations(user, db: Session):
    """
    Generate and store recommendations for a user.
    """

    profile = user.risk_profile or {}

    policies = db.query(models.Policy).all()

    # Clear old recommendations
    db.query(models.Recommendation).filter(
        models.Recommendation.user_id == user.id
    ).delete()

    recommendations = []

    for policy in policies:
        score, reason = score_policy(policy, profile)

        recommendations.append({
            "policy": policy,
            "score": score,
            "reason": reason
        })

    # Sort recommendations
    recommendations.sort(
        key=lambda x: (x["score"], -float(x["policy"].premium)),
        reverse=True
    )

    for r in recommendations:
        recommendation = models.Recommendation(
            user_id=user.id,
            policy_id=r["policy"].id,
            score=r["score"],
            reason=r["reason"]
        )

        db.add(recommendation)

    db.commit()