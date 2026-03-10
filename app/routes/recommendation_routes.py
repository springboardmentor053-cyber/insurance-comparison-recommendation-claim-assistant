from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.deps import get_current_user
from app.services.recommendation_service import generate_recommendations

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/")
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Generate and return top policy recommendations for the current user.
    """

    # Generate recommendations
    generate_recommendations(current_user, db)

    # Fetch top scored policies
    recs = (
        db.query(models.Recommendation)
        .filter(models.Recommendation.user_id == current_user.id)
        .order_by(models.Recommendation.score.desc())
        .limit(5)
        .all()
    )

    return recs