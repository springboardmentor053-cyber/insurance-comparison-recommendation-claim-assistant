from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from .. import models, schemas, database
from typing import List

router = APIRouter(prefix="/policies", tags=["policies"])

@router.get("/", response_model=List[schemas.PolicyResponse])
def get_policies(db: Session = Depends(database.get_db)):
    """
    Fetch all 28 policies from covermate_db, including the provider's name.
    """
    try:
        # 1. Fetch policies and eagerly load the associated provider to prevent N+1 queries
        policies = db.query(models.Policy).options(joinedload(models.Policy.provider)).all()
        
        # 2. Check if the database actually returned data
        if not policies:
            return []

        # 3. Inject provider_name into the policy object 
        # This matches the 'provider_name' field in schemas.PolicyResponse
        for p in policies:
            p.provider_name = p.provider.name if p.provider else "Covermate Standard"
            
        return policies
        
    except Exception as e:
        # If there's a database column mismatch, this will help you debug
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")

@router.get("/{policy_id}", response_model=schemas.PolicyResponse)
def get_policy_details(policy_id: int, db: Session = Depends(database.get_db)):
    """
    Fetch a single policy for the Details Modal.
    """
    policy = db.query(models.Policy).options(joinedload(models.Policy.provider)).filter(models.Policy.id == policy_id).first()
    
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    policy.provider_name = policy.provider.name if policy.provider else "Covermate Standard"
    return policy