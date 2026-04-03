from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, selectinload
from app import models, database
from app.auth import get_current_user
from celery_worker import send_email_task
from typing import List
from app import schemas
import csv
from io import StringIO
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_EMAIL = "shatarupasen23801@gmail.com"

def is_admin(user: models.User) -> bool:
    return user.email == ADMIN_EMAIL

@router.get("/claims", response_model=List[schemas.ClaimDetailResponse])
def get_all_claims(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    claims = db.query(models.Claim).options(
        selectinload(models.Claim.user_policy).selectinload(models.UserPolicy.user),
        selectinload(models.Claim.documents),
        selectinload(models.Claim.fraud_flags)
    ).order_by(models.Claim.created_at.desc()).all()
    return claims

@router.get("/claims/{claim_id}/fraud-flags")
def get_claim_fraud_flags(
    claim_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    flags = db.query(models.FraudFlag).filter(
        models.FraudFlag.claim_id == claim_id
    ).all()
    return flags

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

    user = claim.user_policy.user if claim.user_policy else None
    user_email = user.email if user else "unknown@example.com"
    user_name = user.name if user else "Unknown User"
    email_subject = f"Claim {claim.claim_number} Status Updated"
    email_body = f"""
Hello {user_name},

Your claim (ID: {claim.claim_number}) status has been updated to: {status.upper()}.

Thank you for using Covermate.
"""
    send_email_task.delay(user_email, email_subject, email_body)
    return {"message": "Claim status updated", "status": status}

@router.get("/dashboard")
def dashboard_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    total_claims = db.query(models.Claim).count()
    flagged_claims = db.query(models.FraudFlag).count()
    approved_claims = db.query(models.Claim).filter(models.Claim.status == "approved").count()
    rejected_claims = db.query(models.Claim).filter(models.Claim.status == "rejected").count()
    under_review = db.query(models.Claim).filter(models.Claim.status == "under_review").count()
    return {
        "total_claims": total_claims,
        "flagged_claims": flagged_claims,
        "approved_claims": approved_claims,
        "rejected_claims": rejected_claims,
        "under_review": under_review
    }

@router.get("/fraud-flags")
def get_fraud_flags(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    flags = db.query(models.FraudFlag).options(
        selectinload(models.FraudFlag.claim).selectinload(models.Claim.user_policy).selectinload(models.UserPolicy.user)
    ).order_by(models.FraudFlag.created_at.desc()).all()
    return flags

@router.get("/export/claims")
def export_claims(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    claims = db.query(models.Claim).all()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Claim Number", "Amount", "Status", "Filed Date", "User Email"])
    for c in claims:
        user_email = c.user_policy.user.email if c.user_policy and c.user_policy.user else "Unknown"
        writer.writerow([c.claim_number, c.amount_claimed, c.status, c.created_at, user_email])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=claims_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )