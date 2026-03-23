
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.api.deps import get_db, get_current_user
from app.crud import crud_user_policy
from app.schemas.user_policy import BuyPolicyRequest
from app.models.policy import Policy
from app.models.user_policy import UserPolicy

router = APIRouter()


@router.post("/buy", summary="Buy a policy")
def buy_policy(
    data: BuyPolicyRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_policy, error = crud_user_policy.buy_policy(db, current_user.id, data.policy_id)
    if error:
        raise HTTPException(status_code=400, detail=error)
    # Eager-load policy for response
    db.refresh(user_policy)
    return {
        "id": user_policy.id,
        "policy_id": user_policy.policy_id,
        "purchase_date": user_policy.purchase_date,
        "expiry_date": user_policy.expiry_date,
        "premium_paid": float(user_policy.premium_paid),
        "status": user_policy.status,
        "message": "Policy purchased successfully! You can now file claims against this policy.",
    }


@router.get("/my", summary="List my purchased policies")
def my_policies(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    policies = (
        db.query(UserPolicy)
        .options(joinedload(UserPolicy.policy))
        .filter(UserPolicy.user_id == current_user.id)
        .order_by(UserPolicy.created_at.desc())
        .all()
    )
    result = []
    for up in policies:
        p = up.policy
        result.append({
            "id": up.id,
            "status": up.status,
            "purchase_date": up.purchase_date,
            "expiry_date": up.expiry_date,
            "premium_paid": float(up.premium_paid),
            "policy": {
                "id": p.id,
                "title": p.title,
                "policy_type": p.policy_type,
                "premium": float(p.premium),
                "coverage": p.coverage,
                "description": getattr(p, "description", None),
                "provider": {"name": p.provider.name} if p.provider else None,
            } if p else None,
        })
    return result


@router.get("/{user_policy_id}", summary="Get one purchased policy")
def get_user_policy(
    user_policy_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    up = crud_user_policy.get_user_policy(db, user_policy_id, current_user.id)
    if not up:
        raise HTTPException(status_code=404, detail="User policy not found")
    return up
