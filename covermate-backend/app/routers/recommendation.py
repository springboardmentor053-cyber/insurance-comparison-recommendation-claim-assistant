# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from app.database import get_db
# from app.models.policy import Policy
# from app.models.user import User
# from app.models.recommendation import Recommendation
# from app.routers.auth import get_current_user
# from pydantic import BaseModel

# class RecommendationInput(BaseModel):
#     age: int
#     family_size: int

# router = APIRouter(
#     prefix="/recommendations",
#     tags=["Recommendations"]
# )

# @router.get("/")
# def get_recommendations(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):

#     if not current_user:
#         raise HTTPException(status_code=401, detail="Unauthorized")

#     risk = current_user.risk_profile

#     # Filter policies based on risk
#     if risk == "Low":
#         policies = db.query(Policy).filter(Policy.premium <= 10000).all()

#     elif risk == "Medium":
#         policies = db.query(Policy).filter(
#             Policy.premium > 10000,
#             Policy.premium <= 40000
#         ).all()

#     elif risk == "High":
#         policies = db.query(Policy).filter(
#             Policy.premium > 40000
#         ).all()

#     else:
#         policies = db.query(Policy).all()

#     # Clear old recommendations for this user
#     db.query(Recommendation).filter(
#         Recommendation.user_id == current_user.id
#     ).delete()
#     db.commit()

#     recommendations_output = []

#     # scoring logic
#     for policy in policies:

#         score = 0
#         reason_parts = []

#         # Risk alignment
#         if risk == "Low":
#             score += 40
#             reason_parts.append("Premium fits low-risk budget range")

#         elif risk == "Medium":
#             score += 40
#             reason_parts.append("Balanced premium suitable for medium risk")

#         elif risk == "High":
#             score += 40
#             reason_parts.append("High-value policy suitable for high risk appetite")

#         # Premium strength
#         if policy.premium > 40000:
#             score += 30
#             reason_parts.append("Offers high financial coverage")

#         elif policy.premium > 15000:
#             score += 20
#             reason_parts.append("Provides moderate coverage")

#         else:
#             score += 10
#             reason_parts.append("Affordable premium option")

#         # Deductible factor
#         if policy.deductible < 10000:
#             score += 20
#             reason_parts.append("Lower deductible reduces out-of-pocket cost")
#         else:
#             score += 10
#             reason_parts.append("Standard deductible level")

#         # Policy duration 
#         if policy.term_months >= 24:
#             score += 10
#             reason_parts.append("Longer coverage duration")

#         reason = ". ".join(reason_parts)


#         recommendation = Recommendation(
#             user_id=current_user.id,
#             policy_id=policy.id,
#             score=score,
#             reason=reason
#         )

#         db.add(recommendation)
#         db.commit()

#         recommendations_output.append({
#             "policy_id": policy.id,
#             "title": policy.title,
#             "premium": policy.premium,
#             "score": score,
#             "reason": reason
#         })

#     # Rank and return Top 3 only
#     recommendations_output.sort(key=lambda x: x["score"], reverse=True)

#     return recommendations_output[:3]


# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from app.database import get_db
# from app.models.policy import Policy
# from app.models.user import User
# from app.models.recommendation import Recommendation
# from app.routers.auth import get_current_user
# from pydantic import BaseModel


# # Input model for new recommendation engine
# class RecommendationInput(BaseModel):
#     age: int
#     income: float
#     budget: float
#     family_size: int
#     health_status: str


# router = APIRouter(
#     prefix="/recommendations",
#     tags=["Recommendations"]
# )


# # EXISTING RECOMMENDATION SYSTEM (DO NOT CHANGE)
# @router.get("/")
# def get_recommendations(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):

#     if not current_user:
#         raise HTTPException(status_code=401, detail="Unauthorized")

#     risk = current_user.risk_profile

#     if risk == "Low":
#         policies = db.query(Policy).filter(Policy.premium <= 10000).all()

#     elif risk == "Medium":
#         policies = db.query(Policy).filter(
#             Policy.premium > 10000,
#             Policy.premium <= 40000
#         ).all()

#     elif risk == "High":
#         policies = db.query(Policy).filter(
#             Policy.premium > 40000
#         ).all()

#     else:
#         policies = db.query(Policy).all()

#     db.query(Recommendation).filter(
#         Recommendation.user_id == current_user.id
#     ).delete()
#     db.commit()

#     recommendations_output = []

#     for policy in policies:

#         score = 0
#         reason_parts = []

#         if risk == "Low":
#             score += 40
#             reason_parts.append("Premium fits low-risk budget range")

#         elif risk == "Medium":
#             score += 40
#             reason_parts.append("Balanced premium suitable for medium risk")

#         elif risk == "High":
#             score += 40
#             reason_parts.append("High-value policy suitable for high risk appetite")

#         if policy.premium > 40000:
#             score += 30
#             reason_parts.append("Offers high financial coverage")

#         elif policy.premium > 15000:
#             score += 20
#             reason_parts.append("Provides moderate coverage")

#         else:
#             score += 10
#             reason_parts.append("Affordable premium option")

#         if policy.deductible < 10000:
#             score += 20
#             reason_parts.append("Lower deductible reduces out-of-pocket cost")
#         else:
#             score += 10
#             reason_parts.append("Standard deductible level")

#         if policy.term_months >= 24:
#             score += 10
#             reason_parts.append("Longer coverage duration")

#         reason = ". ".join(reason_parts)

#         recommendation = Recommendation(
#             user_id=current_user.id,
#             policy_id=policy.id,
#             score=score,
#             reason=reason
#         )

#         db.add(recommendation)
#         db.commit()

#         recommendations_output.append({
#             "policy_id": policy.id,
#             "title": policy.title,
#             "premium": policy.premium,
#             "score": score,
#             "reason": reason
#         })

#     recommendations_output.sort(key=lambda x: x["score"], reverse=True)

#     return recommendations_output[:3]


# # NEW REAL-TIME RECOMMENDATION ENGINE
# @router.post("/generate")
# def generate_recommendations(
#     data: RecommendationInput,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):

#     policies = db.query(Policy).all()

#     results = []

#     for policy in policies:

#         score = 0
#         reason_parts = []

#         # AGE BASED LOGIC
#         if data.age < 30:
#             if policy.policy_type.value in ["travel", "health"]:
#                 score += 30
#                 reason_parts.append("Suitable for young individuals")

#         elif 30 <= data.age <= 45:
#             if policy.policy_type.value in ["health", "life"]:
#                 score += 30
#                 reason_parts.append("Balanced protection for working professionals")

#         else:
#             if policy.policy_type.value == "life":
#                 score += 30
#                 reason_parts.append("Recommended for long-term financial protection")


#         # FAMILY SIZE LOGIC
#         if data.family_size >= 3:
#             if policy.policy_type.value in ["health", "home"]:
#                 score += 25
#                 reason_parts.append("Good option for family coverage")


#         # PREMIUM LOGIC
#         if policy.premium < 10000:
#             score += 15
#             reason_parts.append("Affordable premium")

#         elif policy.premium < 30000:
#             score += 20
#             reason_parts.append("Moderate premium with better coverage")

#         else:
#             score += 25
#             reason_parts.append("High coverage policy")


#         # DEDUCTIBLE LOGIC
#         if policy.deductible < 5000:
#             score += 20
#             reason_parts.append("Low deductible reduces cost")


#         reason = ". ".join(reason_parts)

#         results.append({
#             "policy_id": policy.id,
#             "title": policy.title,
#             "policy_type": policy.policy_type,
#             "premium": policy.premium,
#             "score": score,
#             "reason": reason
#         })

#     results.sort(key=lambda x: x["score"], reverse=True)

#     return results[:3]


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
    
    results = []
    
    for policy in policies:
        
        score = 0
        
        reason_parts = []
        
        # AGE BASED LOGIC
        if data.age < 25:
            
            if policy.policy_type.value in ["travel", "health"]:
                score += 25
                reason_parts.append("Suitable for young individuals")
                
            elif 25 <= data.age <= 40:
                
                if policy.policy_type.value in ["health", "life"]:
                    score += 25
                    reason_parts.append("Good protection for working professionals")
                    
                else:
                    if policy.policy_type.value in ["life", "health"]:
                        score += 25
                        reason_parts.append("Recommended for long-term financial protection")

    # FAMILY SIZE LOGIC
    if data.family_size == 1:
        if policy.policy_type.value in ["travel", "health"]:
            score += 20
            reason_parts.append("Good for individual coverage")

    elif data.family_size >= 3:
        if policy.policy_type.value in ["health", "home"]:
            score += 30
            reason_parts.append("Suitable for family coverage")

    # BUDGET MATCH LOGIC
    premium_diff = abs(float(policy.premium) - data.budget)

    if premium_diff <= 5000:
        score += 30
        reason_parts.append("Premium fits your budget")

    elif premium_diff <= 15000:
        score += 20
        reason_parts.append("Slightly above budget but offers value")

    else:
        score += 10
        reason_parts.append("Higher premium policy")

    # HEALTH STATUS LOGIC
    if data.health_status == "good":
        if float(policy.deductible) >= 5000:
            score += 15
            reason_parts.append("Higher deductible acceptable for good health")

    elif data.health_status == "average":
        if float(policy.deductible) < 7000:
            score += 20
            reason_parts.append("Balanced deductible for average health")

    elif data.health_status == "critical":
        if float(policy.deductible) < 5000:
            score += 30
            reason_parts.append("Low deductible helpful for medical needs")

    reason = ". ".join(reason_parts)

    results.append({
        "policy_id": policy.id,
        "title": policy.title,
        "policy_type": policy.policy_type,
        "premium": policy.premium,
        "score": score,
        "reason": reason
    })
    
    results.sort(key=lambda x: x["score"], reverse=True)
    
    return results[:3]

