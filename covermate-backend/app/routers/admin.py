from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.database import get_db
from app.models.claim import Claim
from app.models.claim_status_history import ClaimStatusHistory
from app.models.user_policy import UserPolicy
from app.models.user import User
from app.models.policy import Policy
from app.routers.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Valid status transitions (mentor requirement) ─────────────
VALID_TRANSITIONS = {
    "submitted":    ["under_review"],
    "under_review": ["approved", "rejected"],
    "approved":     ["paid"],
    "rejected":     [],
    "paid":         []
}

# ── Fraud rules config ────────────────────────────────────────
FRAUD_RULES = {
    "duplicate_within_days": 30,    # same policy claimed twice in 30 days
    "amount_multiplier": 3.0,       # amount > 3x annual premium is suspicious
}


# ── Helper: verify admin ──────────────────────────────────────
def require_admin(current_user: User):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )


# ── Helper: record status history ─────────────────────────────
def record_history(claim_id: int, status: str, changed_by: str, db: Session):
    db.add(ClaimStatusHistory(
        claim_id=claim_id,
        status=status,
        changed_by=changed_by
    ))


# ── Helper: run fraud checks on a claim ──────────────────────
def run_fraud_checks(claim: Claim, db: Session) -> list:
    flags = []

    # Rule 1 — Duplicate claim on same policy within 30 days
    cutoff = datetime.utcnow() - timedelta(days=FRAUD_RULES["duplicate_within_days"])
    duplicate = db.query(Claim).filter(
        Claim.user_policy_id == claim.user_policy_id,
        Claim.id != claim.id,
        Claim.status != "draft",
        Claim.created_at >= cutoff
    ).first()

    if duplicate:
        flags.append({
            "rule_code": "DUPLICATE_CLAIM",
            "severity": "high",
            "detail": f"Another claim (#{duplicate.claim_number}) was filed on the same policy within 30 days"
        })

    # Rule 2 — Claimed amount too high vs policy premium
    user_policy = db.query(UserPolicy).filter(
        UserPolicy.id == claim.user_policy_id
    ).first()
    if user_policy:
        policy = db.query(Policy).filter(
            Policy.id == user_policy.policy_id
        ).first()
        if policy and claim.amount_claimed:
            threshold = float(policy.premium) * FRAUD_RULES["amount_multiplier"]
            if float(claim.amount_claimed) > threshold:
                flags.append({
                    "rule_code": "HIGH_AMOUNT",
                    "severity": "medium",
                    "detail": f"Claimed amount ₹{claim.amount_claimed} exceeds {FRAUD_RULES['amount_multiplier']}x the policy premium ₹{policy.premium}"
                })

    # Rule 3 — Future incident date
    if claim.incident_date and claim.incident_date > datetime.utcnow().date():
        flags.append({
            "rule_code": "FUTURE_DATE",
            "severity": "high",
            "detail": f"Incident date {claim.incident_date} is in the future"
        })

    return flags


# ══════════════════════════════════════════════════════════════
# ADMIN ENDPOINTS
# ══════════════════════════════════════════════════════════════

# ── GET /admin/claims — all claims with fraud flags ───────────

@router.get("/claims")
def get_all_claims(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    results = (
        db.query(Claim, UserPolicy, User)
        .join(UserPolicy, UserPolicy.id == Claim.user_policy_id)
        .join(User, User.id == UserPolicy.user_id)
        .filter(Claim.status != "draft")  # admins see submitted+ only
        .order_by(Claim.created_at.desc())
        .all()
    )

    claims_data = []
    for claim, user_policy, user in results:
        fraud_flags = run_fraud_checks(claim, db)
        claims_data.append({
            "claim_id": claim.id,
            "claim_number": claim.claim_number,
            "claim_type": claim.claim_type,
            "incident_date": str(claim.incident_date) if claim.incident_date else None,
            "amount_claimed": float(claim.amount_claimed) if claim.amount_claimed else None,
            "status": claim.status,
            "created_at": str(claim.created_at),
            "user_name": user.name,
            "user_email": user.email,
            "fraud_flags": fraud_flags,
            "is_flagged": len(fraud_flags) > 0
        })

    return claims_data


# ── PUT /admin/claims/{claim_id}/status ───────────────────────
# Update claim status with valid transition enforcement

class StatusUpdate(BaseModel):
    status: str

@router.put("/claims/{claim_id}/status")
def update_claim_status(
    claim_id: int,
    data: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # ✅ Enforce valid transitions (mentor requirement)
    allowed = VALID_TRANSITIONS.get(claim.status, [])
    if data.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition. '{claim.status}' can only move to: {allowed}"
        )

    old_status = claim.status
    claim.status = data.status
    db.commit()
    db.refresh(claim)

    # Record in history
    record_history(claim.id, data.status, f"admin:{current_user.email}", db)
    db.commit()

    return {
        "message": f"Status updated from '{old_status}' to '{data.status}'",
        "claim_id": claim.id,
        "claim_number": claim.claim_number,
        "status": claim.status
    }


# ── GET /admin/claims/{claim_id}/fraud-check ─────────────────
# Run fraud check on a specific claim

@router.get("/claims/{claim_id}/fraud-check")
def check_fraud(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    flags = run_fraud_checks(claim, db)

    return {
        "claim_id": claim.id,
        "claim_number": claim.claim_number,
        "fraud_flags": flags,
        "is_flagged": len(flags) > 0,
        "flag_count": len(flags)
    }


# ── GET /admin/analytics ──────────────────────────────────────
# Dashboard summary stats

@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    all_claims = db.query(Claim).filter(Claim.status != "draft").all()

    total = len(all_claims)
    submitted = sum(1 for c in all_claims if c.status == "submitted")
    under_review = sum(1 for c in all_claims if c.status == "under_review")
    approved = sum(1 for c in all_claims if c.status == "approved")
    rejected = sum(1 for c in all_claims if c.status == "rejected")
    paid = sum(1 for c in all_claims if c.status == "paid")

    # Count flagged claims
    flagged = sum(1 for c in all_claims if len(run_fraud_checks(c, db)) > 0)

    # Total amount claimed
    total_amount = sum(
        float(c.amount_claimed) for c in all_claims if c.amount_claimed
    )

    # Total users
    total_users = db.query(User).filter(User.is_admin == False).count()

    return {
        "total_claims": total,
        "submitted": submitted,
        "under_review": under_review,
        "approved": approved,
        "rejected": rejected,
        "paid": paid,
        "fraud_flagged": flagged,
        "total_amount_claimed": round(total_amount, 2),
        "total_users": total_users
    }