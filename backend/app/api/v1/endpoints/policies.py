
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import crud, schemas
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.Policy])
def read_policies(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    policy_type: Optional[str] = None
):
    policies = crud.crud_policy.get_multi(db, skip=skip, limit=limit, policy_type=policy_type)
    return policies

@router.get("/{id}", response_model=schemas.Policy)
def read_policy(
    id: int,
    db: Session = Depends(deps.get_db),
):
    policy = crud.crud_policy.get(db, policy_id=id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy
