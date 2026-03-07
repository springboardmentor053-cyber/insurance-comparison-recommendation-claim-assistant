from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app import models, schemas, database  # Changed from .. to app
from typing import List, Optional

router = APIRouter(prefix="/policies", tags=["policies"])

@router.get("/", response_model=List[schemas.PolicyResponse])
def get_policies(
    policy_type: Optional[str] = None,
    provider_id: Optional[int] = None,
    min_premium: Optional[float] = None,
    max_premium: Optional[float] = None,
    db: Session = Depends(database.get_db)
):
    """
    Fetch all policies with optional filtering
    """
    try:
        # Start query
        query = db.query(models.Policy).options(joinedload(models.Policy.provider))
        
        # Apply filters
        if policy_type:
            query = query.filter(models.Policy.policy_type == policy_type)
        
        if provider_id:
            query = query.filter(models.Policy.provider_id == provider_id)
        
        if min_premium is not None:
            query = query.filter(models.Policy.premium >= min_premium)
        
        if max_premium is not None:
            query = query.filter(models.Policy.premium <= max_premium)
        
        policies = query.all()
        
        # Add provider name
        for p in policies:
            p.provider_name = p.provider.name if p.provider else "Covermate Standard"
            
        return policies
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")

@router.get("/{policy_id}", response_model=schemas.PolicyResponse)
def get_policy_details(
    policy_id: int, 
    db: Session = Depends(database.get_db)
):
    """
    Fetch a single policy with full details
    """
    policy = db.query(models.Policy).options(
        joinedload(models.Policy.provider)
    ).filter(models.Policy.id == policy_id).first()
    
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    policy.provider_name = policy.provider.name if policy.provider else "Covermate Standard"
    return policy

@router.get("/types/summary")
def get_policy_types_summary(db: Session = Depends(database.get_db)):
    """
    Get summary of available policy types with counts
    """
    summary = db.query(
        models.Policy.policy_type,
        func.count(models.Policy.id).label('count'),
        func.min(models.Policy.premium).label('min_premium'),
        func.max(models.Policy.premium).label('max_premium'),
        func.avg(models.Policy.premium).label('avg_premium')
    ).group_by(
        models.Policy.policy_type
    ).all()
    
    return [
        {
            "type": s[0],
            "count": s[1],
            "min_premium": float(s[2]) if s[2] else 0,
            "max_premium": float(s[3]) if s[3] else 0,
            "avg_premium": float(s[4]) if s[4] else 0
        }
        for s in summary
    ]

@router.get("/providers/list")
def get_providers(db: Session = Depends(database.get_db)):
    """
    Get list of all insurance providers
    """
    providers = db.query(models.Provider).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "country": p.country,
            "policy_count": len(p.policies)
        }
        for p in providers
    ]