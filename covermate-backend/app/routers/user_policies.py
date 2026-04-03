from fastapi import APIRouter, Depends, HTTPException
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
    # ── Check if user already owns this policy ──
    existing = db.query(UserPolicy).filter(
        UserPolicy.user_id == current_user.id,
        UserPolicy.policy_id == policy_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="You already own this policy.")

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


@router.get("/my-policies")
def get_my_policies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = (
        db.query(UserPolicy, Policy)
        .join(Policy, Policy.id == UserPolicy.policy_id)
        .filter(UserPolicy.user_id == current_user.id)
        .all()
    )

    response = []

    for up, policy in results:
        response.append({
            "user_policy_id": up.id,
            "policy_title": policy.title,
            "premium": float(policy.premium),
            "policy_type": policy.policy_type,
            "status": up.status,
            "purchase_date": str(up.purchase_date) if up.purchase_date else None
        })

    return response