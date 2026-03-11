from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.policy import Policy
from app.models.user import User
from app.models.recommendation import Recommendation
from app.routers.auth import get_current_user
from pydantic import BaseModel

# Input model for new recommendation engine

class RecommendationInput(BaseModel):
    age: int
    income: float
    budget: float
    family_size: int
    health_status: str

router = APIRouter(
prefix="/recommendations",
tags=["Recommendations"]
)

# EXISTING RECOMMENDATION SYSTEM (DO NOT CHANGE)

@router.get("/")
def get_recommendations(
db: Session = Depends(get_db),
current_user: User = Depends(get_current_user)
):
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    risk = current_user.risk_profile
    
    if risk == "Low":
        policies = db.query(Policy).filter(Policy.premium <= 10000).all()
        
    elif risk == "Medium":
        policies = db.query(Policy).filter(
        Policy.premium > 10000,
        Policy.premium <= 40000
    ).all()
        
    elif risk == "High":
        policies = db.query(Policy).filter(
        Policy.premium > 40000
    ).all()
        
    else:
        policies = db.query(Policy).all()
        
        db.query(Recommendation).filter(
            Recommendation.user_id == current_user.id
            ).delete()
    db.commit()
    
    recommendations_output = []
    
    for policy in policies:
        
        score = 0
        reason_parts = []
        
        if risk == "Low":
            score += 40
            reason_parts.append("Premium fits low-risk budget range")
            
        elif risk == "Medium":
            score += 40
            reason_parts.append("Balanced premium suitable for medium risk")
            
        elif risk == "High":
            score += 40
            reason_parts.append("High-value policy suitable for high risk appetite")
            
            if policy.premium > 40000:
                score += 30
                reason_parts.append("Offers high financial coverage")
                
            elif policy.premium > 15000:
                score += 20
                reason_parts.append("Provides moderate coverage")
                
            else:
                score += 10
                reason_parts.append("Affordable premium option")
                
                
                if policy.deductible < 10000:
                    score += 20
                    reason_parts.append("Lower deductible reduces out-of-pocket cost")
                    
                else:
                    score += 10
                    reason_parts.append("Standard deductible level")
                    
                    if policy.term_months >= 24:
                        score += 10
                        reason_parts.append("Longer coverage duration")
                        
                        reason = ". ".join(reason_parts)
                        
                        recommendation = Recommendation(
                            user_id=current_user.id,
                            policy_id=policy.id,
                            score=score,
                            reason=reason
                            
                            )
                        
                        db.add(recommendation)
                        db.commit()
                        
                        recommendations_output.append({
                            "policy_id": policy.id,
                            "title": policy.title,
                            "premium": float(policy.premium),
                            "policy_type": policy.policy_type.value,
                            "score": score,
                            "reason": reason
                            })
                        
                        recommendations_output.sort(key=lambda x: x["score"], reverse=True)
                        
    return recommendations_output[:3]


# NEW REAL-TIME RECOMMENDATION ENGINE

@router.post("/generate")
def generate_recommendations(
    data: RecommendationInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    policies = db.query(Policy).all()

    recommendations = []

    for policy in policies:

        premium = float(policy.premium)
        deductible = float(policy.deductible)

        # FILTER BY BUDGET
        
        if premium > data.budget * 1.8:
            continue

        score = 0
        reason_parts = []

        # BUDGET MATCH
    
        diff = abs(premium - data.budget)

        if diff <= 3000:
            score += 35
            reason_parts.append("Premium closely matches your budget")

        elif diff <= 8000:
            score += 25
            reason_parts.append("Premium reasonably within your budget")

        else:
            score += 10
            reason_parts.append("Premium slightly higher than your budget")

        # AGE BASED LOGIC
    
        if data.age < 30:

            if policy.policy_type.value in ["health", "travel"]:
                score += 25
                reason_parts.append("Suitable for young individuals")

        elif 30 <= data.age <= 45:

            if policy.policy_type.value in ["health", "life"]:
                score += 25
                reason_parts.append("Balanced protection for working professionals")

        else:

            if policy.policy_type.value == "life":
                score += 25
                reason_parts.append("Ideal for long term life protection")


        # FAMILY SIZE

        if data.family_size >= 3:

            if policy.policy_type.value == "health":
                score += 20
                reason_parts.append("Good family coverage")

        elif data.family_size == 1:

            if policy.policy_type.value in ["health", "travel"]:
                score += 15
                reason_parts.append("Good for individual coverage")

        # HEALTH STATUS
        
        if data.health_status == "critical":

            if deductible < 5000:
                score += 20
                reason_parts.append("Low deductible helpful for medical cases")

        elif data.health_status == "average":

            if deductible < 10000:
                score += 10

        
        # TERM BONUS
        
        if policy.term_months >= 24:
            score += 10
            reason_parts.append("Longer coverage period")

        recommendations.append({
            "policy_id": policy.id,
            "title": policy.title,
            "premium": premium,
            "policy_type": policy.policy_type.value,
            "score": score,
            "reason": ". ".join(reason_parts)
        })

    recommendations.sort(key=lambda x: x["score"], reverse=True)

    return recommendations[:3]
