"""
Fraud Detection Engine – Rules-based fraud analysis for insurance claims.

Runs automatically when a claim is submitted. Each rule checks a specific
fraud pattern and creates a FraudFlag record if the pattern is detected.

Rules:
    DUP_DOC          → Duplicate document found in another claim           (high)
    SUSPICIOUS_TIMING → Claim filed within 2 days of policy start          (medium)
    HIGH_AMOUNT       → Claimed amount exceeds the policy coverage maximum  (medium)

Usage:
    from app.fraud_engine import run_fraud_checks
    run_fraud_checks(claim_id, db)
"""

from app import models
from sqlalchemy.orm import Session


# ─────────────────── RULE 1 — Duplicate Document ───────────────────

def check_duplicate_documents(claim_id: int, db: Session) -> None:
    """
    Detects if any document uploaded for this claim has the same file_url
    as a document on a *different* claim.  If so, creates a DUP_DOC flag.
    """
    docs = (
        db.query(models.ClaimDocument)
        .filter(models.ClaimDocument.claim_id == claim_id)
        .all()
    )

    already_flagged = False
    for doc in docs:
        duplicate = (
            db.query(models.ClaimDocument)
            .filter(
                models.ClaimDocument.file_url == doc.file_url,
                models.ClaimDocument.claim_id != claim_id,
            )
            .first()
        )
        if duplicate and not already_flagged:
            flag = models.FraudFlag(
                claim_id=claim_id,
                rule_code="DUP_DOC",
                severity="high",
                details=(
                    f"Document '{doc.doc_type}' (url: {doc.file_url}) "
                    f"was previously uploaded for claim ID {duplicate.claim_id}."
                ),
            )
            db.add(flag)
            already_flagged = True  # one flag per claim is enough

    if already_flagged:
        db.commit()


# ─────────────────── RULE 2 — Suspicious Timing ───────────────────

def check_suspicious_timing(claim_id: int, db: Session) -> None:
    """
    Flags claims whose incident_date is within 2 days of the policy start_date.
    This pattern suggests possible pre-planned fraud.
    """
    claim = (
        db.query(models.Claim)
        .filter(models.Claim.id == claim_id)
        .first()
    )
    if not claim or not claim.incident_date:
        return

    user_policy = (
        db.query(models.UserPolicy)
        .filter(models.UserPolicy.id == claim.user_policy_id)
        .first()
    )
    if not user_policy or not user_policy.start_date:
        return

    days_diff = (claim.incident_date - user_policy.start_date).days

    if days_diff < 2:
        flag = models.FraudFlag(
            claim_id=claim_id,
            rule_code="SUSPICIOUS_TIMING",
            severity="medium",
            details=(
                f"Incident date ({claim.incident_date}) is only {days_diff} day(s) "
                f"after policy start ({user_policy.start_date}). "
                f"Claims within 2 days of policy activation are flagged for review."
            ),
        )
        db.add(flag)
        db.commit()


# ─────────────────── RULE 3 — High Amount ───────────────────

def check_large_amount(claim_id: int, db: Session) -> None:
    """
    Flags claims where the amount_claimed exceeds the policy's coverage maximum.
    Coverage max is read from the JSONB 'coverage' dict under key 'max'.
    """
    claim = (
        db.query(models.Claim)
        .filter(models.Claim.id == claim_id)
        .first()
    )
    if not claim or claim.amount_claimed is None:
        return

    user_policy = (
        db.query(models.UserPolicy)
        .filter(models.UserPolicy.id == claim.user_policy_id)
        .first()
    )
    if not user_policy:
        return

    policy = (
        db.query(models.Policy)
        .filter(models.Policy.id == user_policy.policy_id)
        .first()
    )
    if not policy or not policy.coverage:
        return

    # coverage is JSONB; 'max' key holds the maximum claimable amount
    coverage_max = policy.coverage.get("max")
    if coverage_max is None:
        return

    try:
        coverage_max = float(coverage_max)
    except (TypeError, ValueError):
        return

    if float(claim.amount_claimed) > coverage_max:
        flag = models.FraudFlag(
            claim_id=claim_id,
            rule_code="HIGH_AMOUNT",
            severity="medium",
            details=(
                f"Claim amount ₹{claim.amount_claimed} exceeds the policy's "
                f"maximum coverage of ₹{coverage_max}."
            ),
        )
        db.add(flag)
        db.commit()


# ─────────────────── ORCHESTRATOR ───────────────────

def run_fraud_checks(claim_id: int, db: Session) -> None:
    """
    Run all fraud detection rules against a submitted claim.
    Call this immediately after a claim's status is set to 'submitted'.
    """
    check_duplicate_documents(claim_id, db)
    check_suspicious_timing(claim_id, db)
    check_large_amount(claim_id, db)
