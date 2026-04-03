from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.database import get_db
from app.models.claim import Claim
from app.models.claim_document import ClaimDocument
from app.models.claim_status_history import ClaimStatusHistory
from app.models.user_policy import UserPolicy
from app.models.user import User
from app.models.policy import Policy
from app.routers.auth import get_current_user
from celery_worker import send_email_task
import csv
import io

router = APIRouter(prefix="/admin", tags=["Admin"])


VALID_TRANSITIONS = {
    "submitted": ["under_review"],
    "under_review": ["approved", "rejected"],
    "approved": ["paid"],
    "rejected": [],
    "paid": []
}


FRAUD_RULES = {
    "duplicate_within_days": 30,
    "amount_multiplier": 3.0,
}


def require_admin(current_user: User):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")


def record_history(claim_id: int, status: str, changed_by: str, db: Session):
    db.add(ClaimStatusHistory(claim_id=claim_id, status=status, changed_by=changed_by))


def run_fraud_checks(claim: Claim, db: Session) -> list:

    flags = []

    # Rule 1 — Duplicate claim within 30 days
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

    # Rule 2 — Amount too high vs premium
    user_policy = db.query(UserPolicy).filter(UserPolicy.id == claim.user_policy_id).first()

    if user_policy:
        policy = db.query(Policy).filter(Policy.id == user_policy.policy_id).first()

        if policy and claim.amount_claimed:

            threshold = float(policy.premium) * FRAUD_RULES["amount_multiplier"]

            if float(claim.amount_claimed) > threshold:
                flags.append({
                    "rule_code": "HIGH_AMOUNT",
                    "severity": "medium",
                    "detail": f"Claimed amount Rs.{claim.amount_claimed} exceeds {FRAUD_RULES['amount_multiplier']}x the policy premium Rs.{policy.premium}"
                })

    # Rule 3 — Future incident date
    if claim.incident_date and claim.incident_date > datetime.utcnow().date():

        flags.append({
            "rule_code": "FUTURE_DATE",
            "severity": "high",
            "detail": f"Incident date {claim.incident_date} is in the future"
        })

    # Rule 4 — Duplicate document across claims (only within same user)

    docs = db.query(ClaimDocument).filter(
        ClaimDocument.claim_id == claim.id
    ).all()

    if user_policy:

        user_claim_ids = [
            c.id for c in db.query(Claim).join(UserPolicy)
            .filter(
                UserPolicy.user_id == user_policy.user_id,
                Claim.id != claim.id,
                Claim.status != "draft"
            ).all()
        ]

    else:
        user_claim_ids = []

    for doc in docs:

        filename = doc.file_url.split("/")[-1]

        all_other_docs = db.query(ClaimDocument).filter(
            ClaimDocument.claim_id.in_(user_claim_ids)
        ).all() if user_claim_ids else []

        duplicate_doc = next(
            (d for d in all_other_docs if d.file_url.split("/")[-1] == filename),
            None
        )

        if duplicate_doc:

            flags.append({
                "rule_code": "DUP_DOC",
                "severity": "high",
                "detail": f"Document '{filename}' was already submitted in another claim"
            })

            break

    # Rule 5 — Suspicious timing
    user_policy_for_timing = db.query(UserPolicy).filter(
        UserPolicy.id == claim.user_policy_id
    ).first()

    if user_policy_for_timing and claim.incident_date and user_policy_for_timing.purchase_date:

        days_diff = (claim.incident_date - user_policy_for_timing.purchase_date.date()).days

        if days_diff < 2:

            flags.append({
                "rule_code": "SUSPICIOUS_TIMING",
                "severity": "medium",
                "detail": f"Incident date is within 2 days of policy purchase date ({user_policy_for_timing.purchase_date.date()})"
            })

    return flags


# GET ALL CLAIMS

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
        .filter(Claim.status != "draft")
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

    allowed = VALID_TRANSITIONS.get(claim.status, [])

    if data.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition. '{claim.status}' can only move to: {allowed}"
        )

    user_policy = db.query(UserPolicy).filter(UserPolicy.id == claim.user_policy_id).first()
    user = db.query(User).filter(User.id == user_policy.user_id).first()

    old_status = claim.status
    claim.status = data.status

    db.commit()
    db.refresh(claim)

    record_history(claim.id, data.status, f"admin:{current_user.email}", db)
    db.commit()

    email_message = f"""Hello {user.name},

Your insurance claim has been updated.

Claim Number : {claim.claim_number}
Claim Type   : {claim.claim_type}
New Status   : {data.status.replace("_", " ").title()}

Thank you,
CoverMate Team
"""

    send_email_task.delay(
        user.email,
        f"CoverMate - Claim {claim.claim_number} Status Update",
        email_message
    )

    return {
        "message": f"Status updated from '{old_status}' to '{data.status}'",
        "claim_id": claim.id,
        "claim_number": claim.claim_number,
        "status": claim.status
    }


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
    flagged = sum(1 for c in all_claims if len(run_fraud_checks(c, db)) > 0)

    total_amount = sum(float(c.amount_claimed) for c in all_claims if c.amount_claimed)

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


# EXPORT CLAIMS CSV

@router.get("/export/claims")
def export_claims_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_admin(current_user)

    results = (
        db.query(Claim, UserPolicy, User)
        .join(UserPolicy, UserPolicy.id == Claim.user_policy_id)
        .join(User, User.id == UserPolicy.user_id)
        .filter(Claim.status != "draft")
        .order_by(Claim.created_at.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Claim Number", "User Name", "Email",
        "Claim Type", "Amount Claimed (Rs.)",
        "Incident Date", "Status", "Fraud Flagged", "Filed On"
    ])

    for claim, user_policy, user in results:

        fraud_flags = run_fraud_checks(claim, db)

        writer.writerow([
            claim.claim_number,
            user.name,
            user.email,
            claim.claim_type or "",
            float(claim.amount_claimed) if claim.amount_claimed else 0,
            str(claim.incident_date) if claim.incident_date else "",
            claim.status,
            "Yes" if len(fraud_flags) > 0 else "No",
            str(claim.created_at)[:10]
        ])

    output.seek(0)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=covermate_claims_{datetime.utcnow().strftime('%Y%m%d')}.csv"
        }
    )