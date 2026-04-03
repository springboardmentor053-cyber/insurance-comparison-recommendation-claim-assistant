from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List, Dict, Any
from app import models, schemas, database
from app.auth import get_current_user
from app.core.recommendation_engine import RecommendationEngine
from datetime import datetime, timedelta

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

@router.post("/preferences", response_model=schemas.UserResponse)
async def update_preferences(
    preferences: schemas.UserPreferences,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Update user preferences for recommendations"""
    # Merge with existing risk_profile
    existing_profile = current_user.risk_profile or {}
    
    # Only update fields that are provided
    pref_dict = preferences.dict(exclude_unset=True)
    existing_profile.update(pref_dict)
    
    current_user.risk_profile = existing_profile
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get("/preferences", response_model=schemas.UserPreferences)
async def get_preferences(
    current_user: models.User = Depends(get_current_user)
):
    """Get current user preferences"""
    profile = current_user.risk_profile or {}
    
    # Create preferences object with defaults for missing fields
    return schemas.UserPreferences(
        income=profile.get('income'),
        family_size=profile.get('family_size', 1),
        smoker=profile.get('smoker', False),
        existing_conditions=profile.get('existing_conditions', []),
        risk_appetite=profile.get('risk_appetite', 'medium'),
        coverage_priority=profile.get('coverage_priority', 'balanced'),
        preferred_policy_types=profile.get('preferred_policy_types', []),
        max_budget=profile.get('max_budget'),
        employment_type=profile.get('employment_type'),
        travel_frequency=profile.get('travel_frequency'),
        vehicle_owned=profile.get('vehicle_owned', False),
        home_owned=profile.get('home_owned', False)
    )

@router.post("/generate", response_model=List[schemas.RecommendationResponse])
async def generate_recommendations(
    request: schemas.RecommendationRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Generate or refresh recommendations"""
    engine = RecommendationEngine(db)
    recommendations = engine.generate_recommendations(
        current_user.id, 
        force_refresh=request.refresh
    )
    
    # Convert to response model
    return recommendations

@router.get("/", response_model=List[Dict[str, Any]])
async def get_recommendations(
    limit: int = 10,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get personalized recommendations with policy details"""
    engine = RecommendationEngine(db)
    recommendations = engine.get_recommendations_with_policies(
        current_user.id, 
        limit=limit
    )
    
    return recommendations

@router.get("/explain/{policy_id}")
async def explain_recommendation(
    policy_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get detailed explanation for why a specific policy was recommended"""
    policy = db.query(models.Policy).options(
        joinedload(models.Policy.provider)
    ).filter(models.Policy.id == policy_id).first()
    
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    engine = RecommendationEngine(db)
    user_prefs = current_user.risk_profile or {}
    
    # Add DOB for age calculation
    score, breakdown, reason = engine.calculate_score(policy, user_prefs, current_user.dob)
    
    # Get policy type display name
    policy_type_display = {
        'auto': '🚗 Auto',
        'health': '🏥 Health',
        'life': '❤️ Life',
        'home': '🏠 Home',
        'travel': '✈️ Travel'
    }.get(policy.policy_type, policy.policy_type)
    
    return {
        "policy_id": policy_id,
        "policy_title": policy.title,
        "policy_type": policy_type_display,
        "provider": policy.provider.name if policy.provider else "Covermate",
        "score": round(score, 1),
        "reason": reason,
        "breakdown": {
            "coverage_score": round(breakdown['coverage_score'] * 100, 1),
            "premium_score": round(breakdown['premium_score'] * 100, 1),
            "deductible_score": round(breakdown['deductible_score'] * 100, 1),
            "type_match_score": round(breakdown['type_match_score'] * 100, 1),
            "term_score": round(breakdown['term_score'] * 100, 1)
        },
        "user_profile": {
            "age": engine.calculate_age(current_user.dob),
            "risk_appetite": user_prefs.get('risk_appetite', 'medium'),
            "coverage_priority": user_prefs.get('coverage_priority', 'balanced'),
            "family_size": user_prefs.get('family_size', 1)
        }
    }

@router.delete("/clear")
async def clear_recommendations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Clear all recommendations for current user"""
    db.query(models.Recommendation).filter(
        models.Recommendation.user_id == current_user.id
    ).delete()
    db.commit()
    
    return {"message": "Recommendations cleared successfully"}

@router.get("/stats")
async def get_recommendation_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get statistics about recommendations"""
    total_recs = db.query(models.Recommendation).filter(
        models.Recommendation.user_id == current_user.id
    ).count()
    
    # Get top policy types recommended
    top_types = db.query(
        models.Policy.policy_type,
        db.func.count(models.Recommendation.id).label('count')
    ).join(
        models.Recommendation, models.Recommendation.policy_id == models.Policy.id
    ).filter(
        models.Recommendation.user_id == current_user.id
    ).group_by(
        models.Policy.policy_type
    ).order_by(
        db.desc('count')
    ).limit(3).all()
    
    return {
        "total_recommendations": total_recs,
        "top_policy_types": [{"type": t[0], "count": t[1]} for t in top_types],
        "profile_completeness": len(current_user.risk_profile or {})
    }