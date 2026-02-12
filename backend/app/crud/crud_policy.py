
from sqlalchemy.orm import Session
from app.models.policy import Policy
from app.schemas.policy import PolicyCreate

def get(db: Session, policy_id: int) -> Policy:
    return db.query(Policy).filter(Policy.id == policy_id).first()

def get_multi(db: Session, skip: int = 0, limit: int = 100, policy_type: str = None):
    query = db.query(Policy)
    if policy_type:
        query = query.filter(Policy.policy_type == policy_type)
    return query.offset(skip).limit(limit).all()

def create(db: Session, obj_in: PolicyCreate) -> Policy:
    db_obj = Policy(
        title=obj_in.title,
        policy_type=obj_in.policy_type,
        premium=obj_in.premium,
        term_months=obj_in.term_months,
        deductible=obj_in.deductible,
        coverage=obj_in.coverage,
        tnc_url=obj_in.tnc_url,
        provider_id=obj_in.provider_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
