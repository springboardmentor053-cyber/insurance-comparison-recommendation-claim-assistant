from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app import models, database
from app.auth import get_current_user
from celery_worker import send_email_task
from typing import List
from app import schemas


router = APIRouter(prefix="/admin", tags=["admin"])


ADMIN_EMAIL = "shatarupasen23801@gmail.com"  

def is_admin(user: models.User) -> bool:
    """Check if the user has admin privileges. For demo, check email."""
    return user.email == ADMIN_EMAIL

# ---------- Get all claims (for admin panel) ----------
@router.get("/claims", response_model=List[schemas.ClaimDetailResponse])
def get_all_claims(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")

    claims = db.query(models.Claim).options(
        joinedload(models.Claim.user_policy).joinedload(models.UserPolicy.user),
        joinedload(models.Claim.documents)
    ).order_by(models.Claim.created_at.desc()).all()
    return claims

# ---------- Update claim status (existing endpoint) ----------
@router.put("/claims/{claim_id}/status")
def update_claim_status(
    claim_id: int,
    status: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")

    claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    claim.status = status
    db.commit()

    # Get user email from the policy owner
    user = claim.user_policy.user
    email_subject = f"Claim {claim.claim_number} Status Updated"
    email_body = f"""
Hello {user.name},

Your claim (ID: {claim.claim_number}) status has been updated to: {status.upper()}.

Thank you for using Covermate.
"""
    # Send email asynchronously
    send_email_task.delay(user.email, email_subject, email_body)

    return {"message": "Claim status updated", "status": status}