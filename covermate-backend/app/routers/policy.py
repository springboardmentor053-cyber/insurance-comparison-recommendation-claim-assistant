from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.policy import Policy
from app.models.provider import Provider
from app.schemas.policy_schema import PolicyCreate, PolicyResponse


router = APIRouter(prefix="/policies", tags=["Policies"])

@router.get("/")
def get_all_policies(db: Session = Depends(get_db)):
    return db.query(Policy).all()


@router.get("/type/{policy_type}")
def get_policies_by_type(policy_type: str, db: Session = Depends(get_db)):
    return db.query(Policy).filter(Policy.policy_type == policy_type).all()

# @router.post("/policies")
@router.post("/")
def create_policy(policy: PolicyCreate, db: Session = Depends(get_db)):
    new_policy = Policy(
        title=policy.title,
        policy_type=policy.policy_type,
        premium=policy.premium,
        term_months=policy.term_months,
        deductible=policy.deductible,
        provider_id=policy.provider_id,
        coverage=policy.coverage,
        tnc_url=policy.tnc_url
    )

    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)

    return new_policy
