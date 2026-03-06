from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.services.recommendation_engine import RecommendationEngine

router = APIRouter()


@router.get("/", response_model=List[schemas.Recommendation])
def read_recommendations(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve recommendations for the current user.
    Uses precomputed cache: if recommendations already exist in DB, return them fast.
    If none exist (first time or after profile update), generate and store them.
    """
    existing_count = (
        db.query(models.Recommendation)
        .filter(models.Recommendation.user_id == current_user.id)
        .count()
    )

    if existing_count == 0:
        # First time or cache cleared → generate fresh recommendations
        RecommendationEngine.generate_recommendations(db, user_id=current_user.id)

    # Return cached/newly generated recommendations ordered by score
    recommendations = (
        db.query(models.Recommendation)
        .filter(models.Recommendation.user_id == current_user.id)
        .order_by(models.Recommendation.score.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return recommendations


@router.post("/generate", response_model=List[schemas.Recommendation])
def generate_recommendations(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Force-regenerate recommendations for the current user (Refresh Analysis).
    Clears existing cache and recalculates from scratch.
    """
    recommendations = RecommendationEngine.generate_recommendations(db, user_id=current_user.id)
    return recommendations
