"""
Admin Routes — Claim status management, dashboard stats, fraud flags, and CSV export.

Endpoints:
    GET  /admin/dashboard               → Stats (total, flagged, approved, rejected, paid)
    GET  /admin/claims                  → List all claims (admin only)
    PUT  /admin/claims/{claim_id}/status → Update claim status + send email
    GET  /admin/fraud-flags             → All fraud flags with claim info
    GET  /admin/claims/export           → Download all claims as CSV
"""

import csv
import io

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user

# Resilient email dispatch: uses Celery .delay() if Redis is up, sync fallback otherwise
from app.email_service import dispatch_email

router = APIRouter(prefix="/admin", tags=["Admin"])


# ─── Helper: check admin role ───
def require_admin(current_user: models.User = Depends(get_current_user)):
    """Dependency that ensures the current user has admin role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# ─────────────────── DASHBOARD STATS ───────────────────
@router.get("/dashboard")
def dashboard_stats(
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Returns aggregate dashboard statistics for the admin panel.
    - total_claims: all claims ever filed
    - flagged_claims: claims with at least one FraudFlag
    - approved_claims, rejected_claims, paid_claims: counts by status
    - pending_review: submitted + under_review claims awaiting decision
    """
    total = db.query(models.Claim).count()

    # Count distinct claims that have at least one fraud flag
    flagged = (
        db.query(models.FraudFlag.claim_id)
        .distinct()
        .count()
    )

    approved = db.query(models.Claim).filter(models.Claim.status == "approved").count()
    rejected = db.query(models.Claim).filter(models.Claim.status == "rejected").count()
    paid = db.query(models.Claim).filter(models.Claim.status == "paid").count()
    pending = db.query(models.Claim).filter(
        models.Claim.status.in_(["submitted", "under_review"])
    ).count()
    total_flags = db.query(models.FraudFlag).count()

    return {
        "total_claims": total,
        "flagged_claims": flagged,
        "approved_claims": approved,
        "rejected_claims": rejected,
        "paid_claims": paid,
        "pending_review": pending,
        "total_fraud_flags": total_flags,
    }


# ─────────────────── LIST ALL CLAIMS (admin) ───────────────────
@router.get("/claims", response_model=List[schemas.ClaimResponse])
def list_all_claims(
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin: list every claim in the system with documents and fraud flags."""
    return (
        db.query(models.Claim)
        .options(
            joinedload(models.Claim.documents),
            joinedload(models.Claim.fraud_flags),
            joinedload(models.Claim.user_policy)
                .joinedload(models.UserPolicy.policy)
                .joinedload(models.Policy.provider),
            joinedload(models.Claim.user_policy)
                .joinedload(models.UserPolicy.user),
        )
        .order_by(models.Claim.created_at.desc())
        .all()
    )


# ─────────────────── FRAUD FLAGS ───────────────────
@router.get("/fraud-flags", response_model=List[schemas.FraudFlagResponse])
def get_fraud_flags(
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Return all fraud flags across all claims, newest first.
    Each flag includes claim_id, rule_code, severity, and details.
    """
    return (
        db.query(models.FraudFlag)
        .order_by(models.FraudFlag.created_at.desc())
        .all()
    )


# ─────────────────── CSV EXPORT ───────────────────
@router.get("/claims/export")
def export_claims_csv(
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Stream all claims as a CSV file download.
    Columns: Claim Number, Claimant, Policy, Type, Amount, Status, Filed Date, Fraud Flags
    """
    claims = (
        db.query(models.Claim)
        .options(
            joinedload(models.Claim.fraud_flags),
            joinedload(models.Claim.user_policy)
                .joinedload(models.UserPolicy.policy),
            joinedload(models.Claim.user_policy)
                .joinedload(models.UserPolicy.user),
        )
        .order_by(models.Claim.created_at.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)

    # Header row
    writer.writerow([
        "Claim Number",
        "Claimant",
        "Claimant Email",
        "Policy",
        "Claim Type",
        "Amount Claimed (₹)",
        "Status",
        "Incident Date",
        "Filed Date",
        "Fraud Flags",
        "Flag Severities",
    ])

    for c in claims:
        user = c.user_policy.user if c.user_policy else None
        policy = c.user_policy.policy if c.user_policy else None
        flags = c.fraud_flags or []

        writer.writerow([
            c.claim_number or "",
            user.name if user else "",
            user.email if user else "",
            policy.title if policy else "",
            c.claim_type or "",
            float(c.amount_claimed) if c.amount_claimed is not None else "",
            c.status or "",
            c.incident_date.isoformat() if c.incident_date else "",
            c.created_at.isoformat() if c.created_at else "",
            ", ".join(f.rule_code for f in flags) if flags else "None",
            ", ".join(f.severity for f in flags) if flags else "None",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=claims_export.csv"},
    )


# ─────────────────── UPDATE CLAIM STATUS ───────────────────
@router.put("/claims/{claim_id}/status")
def update_claim_status(
    claim_id: int,
    body: schemas.ClaimStatusUpdate,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Admin updates claim status (under_review, approved, rejected, paid).

    Flow per mentor guidance:
      Step 1: Admin updates claim status  (this endpoint)
      Step 2: FastAPI saves status to DB
      Step 3: FastAPI sends task to Celery  (.delay())
      Step 4: Redis stores task
      Step 5: Celery worker executes task
      Step 6: Email is sent to user
    """
    # 1. Find the claim
    claim = (
        db.query(models.Claim)
        .options(
            joinedload(models.Claim.user_policy)
                .joinedload(models.UserPolicy.user),
            joinedload(models.Claim.user_policy)
                .joinedload(models.UserPolicy.policy),
        )
        .filter(models.Claim.id == claim_id)
        .first()
    )
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    old_status = claim.status

    # Validate status transition
    valid_transitions = {
        "draft": ["submitted"],
        "submitted": ["under_review"],
        "under_review": ["approved", "rejected"],
        "approved": ["paid"],
        "rejected": [],
        "paid": [],
    }

    if body.status not in valid_transitions.get(old_status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{old_status}' to '{body.status}'"
        )

    # 2. Save status
    claim.status = body.status
    db.commit()
    db.refresh(claim)

    # 3. Log admin action
    log = models.AdminLog(
        admin_id=admin.id,
        action=f"Changed claim {claim.claim_number} status from {old_status} to {body.status}",
        target_type="claim",
        target_id=claim.id,
    )
    db.add(log)
    db.commit()

    # 4. Send email notification via Celery (.delay() pushes to Redis)
    user = claim.user_policy.user
    policy_title = claim.user_policy.policy.title if claim.user_policy.policy else "your policy"

    email_body = f"""Hello {user.name},

Your claim {claim.claim_number} status has been updated.

Current Status: {body.status.upper()}

Claim Details:
- Claim Number: {claim.claim_number}
- Policy: {policy_title}
- Amount: ₹{claim.amount_claimed}

Thank you for using CoverMate.
"""

    # ✅ Dispatch via Celery (.delay()) → Redis → Worker → Email
    dispatch_email(
        user.email,
        f"Claim Status Update — {claim.claim_number}",
        email_body,
    )

    return {
        "message": f"Status updated to '{body.status}'",
        "claim_id": claim.id,
        "claim_number": claim.claim_number,
        "old_status": old_status,
        "new_status": body.status,
    }


# ─────────────────── ACCEPT CLAIM ───────────────────
@router.post("/claims/{claim_id}/accept")
def accept_claim(
    claim_id: int,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin approves a claim — sets status to 'approved' and emails user."""
    claim = (
        db.query(models.Claim)
        .options(
            joinedload(models.Claim.user_policy).joinedload(models.UserPolicy.user),
            joinedload(models.Claim.user_policy).joinedload(models.UserPolicy.policy),
        )
        .filter(models.Claim.id == claim_id)
        .first()
    )
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status not in ("submitted", "under_review"):
        raise HTTPException(status_code=400, detail=f"Cannot approve claim in '{claim.status}' status")

    claim.status = "approved"
    db.add(models.AdminLog(
        admin_id=admin.id, action=f"Accepted claim {claim.claim_number}",
        target_type="claim", target_id=claim.id
    ))
    db.commit()

    user = claim.user_policy.user
    policy_title = claim.user_policy.policy.title if claim.user_policy.policy else "your policy"
    dispatch_email(
        user.email,
        f"✅ Your Claim {claim.claim_number} has been Approved!",
        f"Hello {user.name},\n\nGreat news! Your claim {claim.claim_number} for {policy_title} has been approved.\n\nPayout of ₹{claim.amount_claimed} will be processed shortly.\n\nThank you for trusting CoverMate.",
    )
    return {"message": "Claim approved", "claim_id": claim_id, "status": "approved"}


# ─────────────────── REJECT CLAIM ───────────────────
@router.post("/claims/{claim_id}/reject")
def reject_claim(
    claim_id: int,
    body: schemas.ClaimRejectBody,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin rejects a claim — reason is mandatory, emails user with reason."""
    claim = (
        db.query(models.Claim)
        .options(
            joinedload(models.Claim.user_policy).joinedload(models.UserPolicy.user),
            joinedload(models.Claim.user_policy).joinedload(models.UserPolicy.policy),
        )
        .filter(models.Claim.id == claim_id)
        .first()
    )
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status not in ("submitted", "under_review"):
        raise HTTPException(status_code=400, detail=f"Cannot reject claim in '{claim.status}' status")

    claim.status = "rejected"
    db.add(models.AdminLog(
        admin_id=admin.id,
        action=f"Rejected claim {claim.claim_number}. Reason: {body.reason}",
        target_type="claim", target_id=claim.id
    ))
    db.commit()

    user = claim.user_policy.user
    policy_title = claim.user_policy.policy.title if claim.user_policy.policy else "your policy"
    dispatch_email(
        user.email,
        f"❌ Update on Your Claim {claim.claim_number}",
        f"Hello {user.name},\n\nWe regret to inform you that your claim {claim.claim_number} for {policy_title} has been rejected.\n\nReason: {body.reason}\n\nIf you believe this is incorrect, please contact our support team.\n\nThank you for using CoverMate.",
    )
    return {"message": "Claim rejected", "claim_id": claim_id, "status": "rejected", "reason": body.reason}


# ─────────────────── REQUEST MORE INFO ───────────────────
@router.post("/claims/{claim_id}/request-info")
def request_more_info(
    claim_id: int,
    body: schemas.ClaimRequestInfoBody,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin sends a custom message to the user requesting additional information/documents."""
    claim = (
        db.query(models.Claim)
        .options(
            joinedload(models.Claim.user_policy).joinedload(models.UserPolicy.user),
        )
        .filter(models.Claim.id == claim_id)
        .first()
    )
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    db.add(models.AdminLog(
        admin_id=admin.id,
        action=f"Requested info on claim {claim.claim_number}: {body.message}",
        target_type="claim", target_id=claim.id
    ))
    db.commit()

    user = claim.user_policy.user
    dispatch_email(
        user.email,
        f"📋 Action Required — Claim {claim.claim_number}",
        f"Hello {user.name},\n\nOur team is reviewing your claim {claim.claim_number} and needs additional information:\n\n{body.message}\n\nPlease log in to CoverMate and upload the required documents.\n\nThank you for your cooperation.",
    )
    return {"message": "Info request sent to user", "claim_id": claim_id}


# ─────────────────── ANALYTICS: FRAUD BY SEVERITY ───────────────────
@router.get("/analytics/fraud-by-severity")
def analytics_fraud_by_severity(
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Returns fraud flag counts grouped by severity for the Donut chart.
    Response: [{ severity: 'high', count: 5 }, ...]
    """
    from sqlalchemy import func as sqlfunc
    results = (
        db.query(models.FraudFlag.severity, sqlfunc.count(models.FraudFlag.id).label("count"))
        .group_by(models.FraudFlag.severity)
        .all()
    )
    return [{"severity": r.severity, "count": r.count} for r in results]


# ─────────────────── ANALYTICS: FLAGS OVER TIME ───────────────────
@router.get("/analytics/flags-over-time")
def analytics_flags_over_time(
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Returns daily fraud flag counts for the last 30 days for the Bar chart.
    Response: [{ date: '2024-03-01', count: 3 }, ...]
    """
    from sqlalchemy import func as sqlfunc
    from datetime import datetime, timedelta

    cutoff = datetime.utcnow() - timedelta(days=30)
    results = (
        db.query(
            sqlfunc.date(models.FraudFlag.created_at).label("date"),
            sqlfunc.count(models.FraudFlag.id).label("count"),
        )
        .filter(models.FraudFlag.created_at >= cutoff)
        .group_by(sqlfunc.date(models.FraudFlag.created_at))
        .order_by(sqlfunc.date(models.FraudFlag.created_at))
        .all()
    )
    return [{"date": str(r.date), "count": r.count} for r in results]


# ─────────────────── ANALYTICS: KPIs ───────────────────
@router.get("/analytics/kpis")
def analytics_kpis(
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Returns high-level KPIs:
    - pending_claims: submitted + under_review count
    - settlement_ratio: approved / (approved + rejected) * 100
    - total_payouts_this_month: sum of amount_claimed for 'paid' claims this calendar month
    """
    from sqlalchemy import func as sqlfunc
    from datetime import datetime

    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    pending = db.query(models.Claim).filter(
        models.Claim.status.in_(["submitted", "under_review"])
    ).count()

    approved_count = db.query(models.Claim).filter(models.Claim.status == "approved").count()
    rejected_count = db.query(models.Claim).filter(models.Claim.status == "rejected").count()
    decided = approved_count + rejected_count
    settlement_ratio = round((approved_count / decided * 100), 1) if decided > 0 else 0.0

    payouts_result = db.query(sqlfunc.sum(models.Claim.amount_claimed)).filter(
        models.Claim.status == "paid",
        models.Claim.created_at >= month_start,
    ).scalar()
    total_payouts = float(payouts_result or 0)

    return {
        "pending_claims": pending,
        "settlement_ratio": settlement_ratio,
        "total_payouts_this_month": total_payouts,
    }
