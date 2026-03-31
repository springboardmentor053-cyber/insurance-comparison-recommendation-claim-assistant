
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models.user_policy import UserPolicy
from app.models.policy import Policy


def get_user_policies(db: Session, user_id: int):
    return (
        db.query(UserPolicy)
        .filter(UserPolicy.user_id == user_id)
        .all()
    )


def get_user_policy(db: Session, user_policy_id: int, user_id: int):
    return (
        db.query(UserPolicy)
        .filter(UserPolicy.id == user_policy_id, UserPolicy.user_id == user_id)
        .first()
    )


def get_active_user_policies(db: Session, user_id: int):
    """Only active (not expired/cancelled) policies for the user."""
    return (
        db.query(UserPolicy)
        .filter(UserPolicy.user_id == user_id, UserPolicy.status == "active")
        .all()
    )


def buy_policy(db: Session, user_id: int, policy_id: int):
    # Check policy exists
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        return None, "Policy not found"

    # Check if already active
    existing = (
        db.query(UserPolicy)
        .filter(
            UserPolicy.user_id == user_id,
            UserPolicy.policy_id == policy_id,
            UserPolicy.status == "active",
        )
        .first()
    )
    if existing:
        return None, "You already have this policy active"

    purchase_date = date.today()
    expiry_date = purchase_date + timedelta(days=(policy.term_months or 12) * 30)

    user_policy = UserPolicy(
        user_id=user_id,
        policy_id=policy_id,
        purchase_date=purchase_date,
        expiry_date=expiry_date,
        premium_paid=policy.premium,
        status="active",
    )
    db.add(user_policy)
    db.commit()
    db.refresh(user_policy)
    return user_policy, None
