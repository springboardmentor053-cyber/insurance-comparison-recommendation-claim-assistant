from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user_policy import UserPolicy
from app.models.policy import Policy
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/user-policies", tags=["User Policies"])


@router.post("/purchase/{policy_id}")
def purchase_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    purchase = UserPolicy(
        user_id=current_user.id,
        policy_id=policy_id
    )

    db.add(purchase)
    db.commit()
    db.refresh(purchase)

    return {
        "message": "Policy purchased successfully",
        "policy_id": policy_id
    }