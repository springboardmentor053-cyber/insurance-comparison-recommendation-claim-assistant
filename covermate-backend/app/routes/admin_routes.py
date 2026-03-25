"""
Admin Routes – Manage user policies, claims, and send email notifications.
Place this file at: app/routes/admin_routes.py
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user
from app.tasks import send_claim_status_email

router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


# ─────────────────── DASHBOARD STATS ───────────────────
@router.get("/dashboard", response_model=schemas.AdminDashboardStats)
def get_dashboard(db: Session = Depends(get_db), _: models.User = Depends(require_admin)):
    return schemas.AdminDashboardStats(
        total_policies      = db.query(models.Policy).count(),
        total_user_policies = db.query(models.UserPolicy).count(),
        active_policies     = db.query(models.UserPolicy).filter(models.UserPolicy.status == "active").count(),
        expired_policies    = db.query(models.UserPolicy).filter(models.UserPolicy.status == "expired").count(),
        cancelled_policies  = db.query(models.UserPolicy).filter(models.UserPolicy.status == "cancelled").count(),
        total_claims        = db.query(models.Claim).count(),
        pending_claims      = db.query(models.Claim).filter(models.Claim.status == "submitted").count(),
        under_review_claims = db.query(models.Claim).filter(models.Claim.status == "under_review").count(),
        total_users         = db.query(models.User).filter(models.User.role == "user").count(),
    )


# ─────────────────── LIST ALL USER-POLICIES ───────────────────
@router.get("/user-policies", response_model=List[schemas.AdminUserPolicyOut])
def list_user_policies(
    status: Optional[str] = Query(None),
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    q = (
        db.query(models.UserPolicy)
        .options(
            joinedload(models.UserPolicy.user),
            joinedload(models.UserPolicy.policy).joinedload(models.Policy.provider),
        )
    )
    if status:
        q = q.filter(models.UserPolicy.status == status)
    return q.order_by(models.UserPolicy.id.desc()).offset(skip).limit(limit).all()


# ─────────────────── CHANGE USER-POLICY STATUS ───────────────────
@router.patch("/user-policies/{user_policy_id}/status", response_model=schemas.AdminUserPolicyOut)
def update_user_policy_status(
    user_policy_id: int,
    body: schemas.AdminPolicyStatusUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    allowed = {"active", "expired", "cancelled"}
    if body.status not in allowed:
        raise HTTPException(status_code=422, detail=f"Status must be one of: {', '.join(allowed)}")

    up = (
        db.query(models.UserPolicy)
        .options(
            joinedload(models.UserPolicy.user),
            joinedload(models.UserPolicy.policy).joinedload(models.Policy.provider),
        )
        .filter(models.UserPolicy.id == user_policy_id)
        .first()
    )
    if not up:
        raise HTTPException(status_code=404, detail="User policy not found")

    old_status = up.status
    up.status = body.status
    db.commit()
    db.refresh(up)

    db.add(models.AdminLog(
        admin_id=admin.id,
        action=f"Changed UserPolicy #{user_policy_id} status: '{old_status}' → '{body.status}'",
        target_type="user_policy",
        target_id=user_policy_id,
    ))
    db.commit()

    # ✅ Pass note to Celery task so it appears in the email
    send_claim_status_email.delay(
        user_email=up.user.email,
        user_name=up.user.name,
        claim_number=up.policy_number or f"Policy #{up.id}",
        new_status=body.status,
        note=body.note,
    )

    return up


# ─────────────────── LIST ALL CLAIMS ───────────────────
@router.get("/claims", response_model=List[schemas.AdminClaimOut])
def list_claims(
    status: Optional[str] = Query(None),
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    q = (
        db.query(models.Claim)
        .options(
            joinedload(models.Claim.user_policy).joinedload(models.UserPolicy.user),
            joinedload(models.Claim.user_policy).joinedload(models.UserPolicy.policy),
            joinedload(models.Claim.documents),
            joinedload(models.Claim.status_history),
        )
    )
    if status:
        q = q.filter(models.Claim.status == status)
    return q.order_by(models.Claim.id.desc()).offset(skip).limit(limit).all()


# ─────────────────── CHANGE CLAIM STATUS ───────────────────
@router.patch("/claims/{claim_id}/status", response_model=schemas.AdminClaimOut)
def update_claim_status(
    claim_id: int,
    body: schemas.AdminClaimStatusUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    allowed = {"submitted", "under_review", "approved", "rejected", "paid"}
    if body.status not in allowed:
        raise HTTPException(status_code=422, detail=f"Status must be one of: {', '.join(allowed)}")

    claim = (
        db.query(models.Claim)
        .options(
            joinedload(models.Claim.user_policy).joinedload(models.UserPolicy.user),
            joinedload(models.Claim.user_policy).joinedload(models.UserPolicy.policy),
            joinedload(models.Claim.documents),
            joinedload(models.Claim.status_history),
        )
        .filter(models.Claim.id == claim_id)
        .first()
    )
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    old_status = claim.status
    claim.status = body.status

    db.add(models.ClaimStatusHistory(
        claim_id=claim.id,
        status=body.status,
        changed_by=admin.id,
    ))

    db.add(models.AdminLog(
        admin_id=admin.id,
        action=f"Changed Claim #{claim_id} status: '{old_status}' → '{body.status}'",
        target_type="claim",
        target_id=claim_id,
    ))
    db.commit()
    db.refresh(claim)

    claim_user = claim.user_policy.user

    # ✅ Pass note to Celery task so it appears in the email
    send_claim_status_email.delay(
        user_email=claim_user.email,
        user_name=claim_user.name,
        claim_number=claim.claim_number or f"CLM{claim.id:06d}",
        new_status=body.status,
        note=body.note,          # ✅ now actually sent!
    )

    return claim


# ─────────────────── ADMIN LOGS ───────────────────
@router.get("/logs", response_model=List[schemas.AdminLogOut])
def get_admin_logs(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    return (
        db.query(models.AdminLog)
        .order_by(models.AdminLog.timestamp.desc())
        .offset(skip).limit(limit).all()
    )