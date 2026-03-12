from database import SessionLocal, Policy, UserPreference, Recommendation, User
from datetime import datetime

def calculate_policy_score(user_pref: UserPreference, policy: Policy) -> tuple:
    """
    Calculate how well a policy matches user preferences.
    Returns: (score: float, reason: str)
    Score is 0-100, where 100 is perfect match.
    """
    score = 0
    reasons = []
    
    # Factor 1: Price Match (30 points max)
    if policy.premium_monthly <= user_pref.max_monthly_budget:
        score += 30
        reasons.append("Within your budget")
    elif policy.premium_monthly <= user_pref.max_monthly_budget * 1.1:
        score += 20
        reasons.append("Slightly above budget but good value")
    elif policy.premium_monthly <= user_pref.max_monthly_budget * 1.2:
        score += 10
    
    # Factor 2: Coverage Match (40 points max)
    coverage_ratio = policy.coverage_amount / user_pref.preferred_coverage
    if coverage_ratio >= 1.0:
        score += 40
        reasons.append("Meets your coverage needs")
    elif coverage_ratio >= 0.8:
        score += 30
        reasons.append("Good coverage for the price")
    elif coverage_ratio >= 0.6:
        score += 20
    
    # Factor 3: Age Appropriateness (15 points max)
    if user_pref.age < 30:
        if "basic" in policy.name.lower() or policy.premium_monthly < 200:
            score += 15
            reasons.append("Perfect for young professionals")
    elif 30 <= user_pref.age < 50:
        if "premium" in policy.name.lower() or "family" in policy.name.lower():
            score += 15
            reasons.append("Ideal for your life stage")
    else:  # 50+
        if "premium" in policy.name.lower() or policy.coverage_amount > 100000:
            score += 15
            reasons.append("Comprehensive coverage for peace of mind")
    
    # Factor 4: Family Size Match (15 points max)
    if user_pref.family_size > 1:
        if "family" in policy.name.lower():
            score += 15
            reasons.append("Designed for families")
        elif policy.coverage_amount > 100000:
            score += 10
            reasons.append("Good coverage for dependents")
    else:
        if "basic" in policy.name.lower() or "individual" in policy.name.lower():
            score += 15
            reasons.append("Perfect for individuals")
        else:
            score += 8
    
    # Factor 5: Health Status Bonus (bonus points)
    if user_pref.health_status == "excellent":
        if policy.premium_monthly < user_pref.max_monthly_budget * 0.7:
            score += 5
            reasons.append("Your excellent health qualifies you for lower premiums")
    elif user_pref.health_status == "poor":
        if "premium" in policy.name.lower() or policy.coverage_amount > 150000:
            score += 5
            reasons.append("Comprehensive coverage for health concerns")

    # Factor 6: Vehicle Type Match
    if policy.type == "auto" and user_pref.vehicle_type:
        if user_pref.vehicle_type == "premium" and "comprehensive" in policy.name.lower():
            score += 20
            reasons.append("Best comprehensive coverage for premium vehicles")
        elif user_pref.vehicle_type == "basic" and policy.premium_monthly < 50:
            score += 20
            reasons.append("Affordable coverage for basic daily commute vehicles")
    
    # Ensure score doesn't exceed 100
    score = min(score, 100)
    
    # Create reason string
    reason_text = ". ".join(reasons[:3])  # Top 3 reasons
    if not reason_text:
        reason_text = "This policy may suit your needs"
    
    return (round(score, 2), reason_text)


def generate_recommendations(user_id: int):
    """
    Generate policy recommendations for a user based on their preferences.
    Returns: List of recommended policies with scores
    """
    db = SessionLocal()
    
    try:
        # Get user preferences
        user_pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        
        if not user_pref:
            return {"error": "User preferences not found. Please set your preferences first."}
        
        # Get all policies
        all_policies = db.query(Policy).all()
        
        # Delete old recommendations for this user
        db.query(Recommendation).filter(Recommendation.user_id == user_id).delete()
        db.commit()
        
        # Calculate scores for each policy
        recommendations = []
        for policy in all_policies:
            score, reason = calculate_policy_score(user_pref, policy)
            
            # Only recommend policies with score > 30
            if score > 30:
                rec = Recommendation(
                    user_id=user_id,
                    policy_id=policy.id,
                    score=score,
                    reason=reason
                )
                db.add(rec)
                recommendations.append({
                    "policy": policy,
                    "score": score,
                    "reason": reason
                })
        
        db.commit()
        
        # Sort by score (highest first)
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        
        return {
            "success": True,
            "count": len(recommendations),
            "recommendations": recommendations[:5]  # Top 5
        }
    
    finally:
        db.close()