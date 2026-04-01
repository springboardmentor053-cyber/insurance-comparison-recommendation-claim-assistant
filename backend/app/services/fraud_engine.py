"""
Fraud Detection Engine — Rules-based system that runs on every claim submission.

Rules Implemented:
1.  DUP_DOC           (high)     — Duplicate document URL found in another claim
2.  EARLY_CLAIM       (medium)   — Claim filed within 2 days of policy start
3.  HIGH_AMOUNT       (medium)   — Amount claimed exceeds 80% of policy coverage max
4.  MULTI_CLAIM       (medium)   — User has filed more than 3 claims in 30 days
5.  ROUND_AMOUNT      (low)      — Claimed amount is suspiciously round (e.g., 50000, 100000)
6.  MISSING_DOCS      (low)      — No documents uploaded when claim is submitted
7.  REPEAT_PROVIDER   (medium)   — Hospital/location appears in multiple recent claims
8.  FUTURE_DATE       (critical) — Incident date is in the future
9.  EXPIRED_POLICY    (high)     — Claim filed after policy expiry date
10. NEW_USER_LARGE    (medium)   — Account < 60 days old and claiming > 50% of coverage
11. AMOUNT_SPIKE      (medium)   — Amount is 3x+ the user's average past claim
12. SAME_TYPE_FREQ    (medium)   — 2+ same claim type filed by user in 90 days
13. INCONSISTENT_TYPE (high)     — Claim type doesn't match the purchased policy type
14. SHORT_DESCRIPTION (low)      — Incident description is suspiciously short (< 15 chars)
15. SAME_DAY_SUBMIT   (low)      — Claim was created and submitted on the same day
16. INCONSISTENT_DOC  (medium)   — Uploaded document type doesn't match the claim type
"""

from datetime import date, timedelta, datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.claim import Claim, ClaimDocument, FraudFlag


def _add_flag(db: Session, claim_id: int, rule_code: str, severity: str, details: str):
    """Helper to add a single fraud flag, avoiding duplicates."""
    existing = db.query(FraudFlag).filter(
        FraudFlag.claim_id == claim_id,
        FraudFlag.rule_code == rule_code
    ).first()
    if not existing:
        flag = FraudFlag(
            claim_id=claim_id,
            rule_code=rule_code,
            severity=severity,
            details=details
        )
        db.add(flag)


# ─── Rule 1: Duplicate Document ───────────────────────────────────────────────
def check_duplicate_documents(claim_id: int, db: Session):
    """Flag if the same document URL appears in another claim."""
    docs = db.query(ClaimDocument).filter(ClaimDocument.claim_id == claim_id).all()
    for doc in docs:
        duplicate = db.query(ClaimDocument).filter(
            ClaimDocument.file_url == doc.file_url,
            ClaimDocument.claim_id != claim_id
        ).first()
        if duplicate:
            _add_flag(db, claim_id, "DUP_DOC", "high",
                      f"Document '{doc.doc_type}' already exists in claim #{duplicate.claim_id}. Possible reuse of evidence.")
            break


# ─── Rule 2: Early Claim ──────────────────────────────────────────────────────
def check_suspicious_timing(claim: Claim, db: Session):
    """Flag if claim was filed within 2 days of policy activation."""
    user_policy = claim.user_policy
    if user_policy and user_policy.purchase_date:
        days_diff = (claim.incident_date - user_policy.purchase_date).days
        if days_diff < 0:
            _add_flag(db, claim.id, "EARLY_CLAIM", "critical",
                      f"Incident date ({claim.incident_date}) is BEFORE policy start ({user_policy.purchase_date}). Impossible timeline.")
        elif days_diff < 2:
            _add_flag(db, claim.id, "EARLY_CLAIM", "medium",
                      f"Claim filed only {days_diff} day(s) after policy start ({user_policy.purchase_date}). High suspicion of pre-existing intent.")


# ─── Rule 3: High Amount ──────────────────────────────────────────────────────
def check_large_amount(claim: Claim, db: Session):
    """Flag if claimed amount is more than 80% of the policy's max coverage."""
    user_policy = claim.user_policy
    if user_policy and user_policy.policy:
        coverage_dict = getattr(user_policy.policy, "coverage", {})
        if isinstance(coverage_dict, dict):
            numeric_values = [v for v in coverage_dict.values() if isinstance(v, (int, float)) and not isinstance(v, bool)]
            coverage = max(numeric_values) if numeric_values else 500000
        else:
            coverage = 500000
            
        if coverage and float(claim.amount_claimed) > float(coverage) * 0.8:
            pct = round((float(claim.amount_claimed) / float(coverage)) * 100, 1)
            _add_flag(db, claim.id, "HIGH_AMOUNT", "medium",
                      f"Claimed ₹{claim.amount_claimed} is {pct}% of max policy coverage (₹{coverage}). Unusually high proportion.")


# ─── Rule 4: Multiple Claims in 30 Days ──────────────────────────────────────
def check_multiple_claims(claim: Claim, db: Session):
    """Flag if the user has filed more than 3 claims in the last 30 days."""
    thirty_days_ago = date.today() - timedelta(days=30)
    recent_count = db.query(Claim).filter(
        Claim.user_id == claim.user_id,
        Claim.id != claim.id,
        Claim.created_at >= thirty_days_ago,
        Claim.status != "rejected"
    ).count()
    if recent_count >= 3:
        _add_flag(db, claim.id, "MULTI_CLAIM", "medium",
                  f"User has filed {recent_count} other claims in the past 30 days. Pattern may indicate fraudulent activity.")


# ─── Rule 5: Suspiciously Round Amount ───────────────────────────────────────
def check_round_amount(claim: Claim, db: Session):
    """Flag if claimed amount is a perfectly round number (e.g., 50000, 100000)."""
    amount = float(claim.amount_claimed)
    if amount >= 10000 and amount % 10000 == 0:
        _add_flag(db, claim.id, "ROUND_AMOUNT", "low",
                  f"Claimed amount ₹{int(amount):,} is a suspiciously round number. Real expenses rarely end in exact thousands.")


# ─── Rule 6: No Documents Uploaded ───────────────────────────────────────────
def check_missing_documents(claim: Claim, db: Session):
    """Flag if no supporting documents were uploaded at submission time."""
    doc_count = db.query(ClaimDocument).filter(ClaimDocument.claim_id == claim.id).count()
    if doc_count == 0:
        _add_flag(db, claim.id, "MISSING_DOCS", "low",
                  "No documents were uploaded with this claim. Valid claims should have supporting evidence.")


# ─── Rule 7: Repeat Provider / Location ──────────────────────────────────────
def check_repeat_provider(claim: Claim, db: Session):
    """Flag if the same hospital/location appears in 2+ other claims recently."""
    location = claim.hospital_name or claim.incident_location
    if not location:
        return
    ninety_days_ago = date.today() - timedelta(days=90)
    duplicates = db.query(Claim).filter(
        Claim.id != claim.id,
        Claim.created_at >= ninety_days_ago,
        Claim.status != "rejected",
        (Claim.hospital_name == location) | (Claim.incident_location == location)
    ).count()
    if duplicates >= 2:
        _add_flag(db, claim.id, "REPEAT_PROVIDER", "medium",
                  f"Location/provider '{location}' appears in {duplicates} other recent claims. Possible staged incident network.")


# ─── Rule 8: Future Incident Date ────────────────────────────────────────────
def check_future_date(claim: Claim, db: Session):
    """Flag if the incident date is in the future."""
    if claim.incident_date > date.today():
        _add_flag(db, claim.id, "FUTURE_DATE", "critical",
                  f"Incident date {claim.incident_date} is in the future. This is impossible and indicates data fraud.")


# ─── Rule 9: Expired Policy ──────────────────────────────────────────────────
def check_expired_policy(claim: Claim, db: Session):
    """Flag if the claim is filed against an already-expired policy."""
    user_policy = claim.user_policy
    if user_policy and user_policy.expiry_date:
        if claim.incident_date > user_policy.expiry_date:
            _add_flag(db, claim.id, "EXPIRED_POLICY", "high",
                      f"Incident date ({claim.incident_date}) is after policy expiry ({user_policy.expiry_date}). "
                      f"The policy was no longer active at the time of the alleged incident.")


# ─── Rule 10: New User + Large Claim ─────────────────────────────────────────
def check_new_user_large_claim(claim: Claim, db: Session):
    """Flag if account is < 60 days old and claiming > 50% of policy coverage."""
    user = claim.user
    if not user or not user.created_at:
        return
    account_age_days = (datetime.utcnow() - user.created_at.replace(tzinfo=None)).days
    if account_age_days > 60:
        return
    user_policy = claim.user_policy
    if user_policy and user_policy.policy:
        coverage_dict = getattr(user_policy.policy, "coverage", {})
        if isinstance(coverage_dict, dict):
            numeric_values = [v for v in coverage_dict.values() if isinstance(v, (int, float)) and not isinstance(v, bool)]
            coverage = max(numeric_values) if numeric_values else 500000
        else:
            coverage = 500000
            
        if coverage and float(claim.amount_claimed) > float(coverage) * 0.5:
            _add_flag(db, claim.id, "NEW_USER_LARGE", "medium",
                      f"Account is only {account_age_days} days old and is claiming ₹{claim.amount_claimed} "
                      f"(over 50% of coverage ₹{coverage}). New accounts filing large claims are a common fraud pattern.")


# ─── Rule 11: Amount Spike vs Past Average ────────────────────────────────────
def check_amount_spike(claim: Claim, db: Session):
    """Flag if claimed amount is 3x+ the user's average past claim amount."""
    avg = db.query(func.avg(Claim.amount_claimed)).filter(
        Claim.user_id == claim.user_id,
        Claim.id != claim.id,
        Claim.status != "rejected"
    ).scalar()
    if avg and float(avg) > 0:
        ratio = float(claim.amount_claimed) / float(avg)
        if ratio >= 3.0:
            _add_flag(db, claim.id, "AMOUNT_SPIKE", "medium",
                      f"Claimed ₹{claim.amount_claimed} is {round(ratio, 1)}x the user's average past claim of ₹{round(float(avg), 0):.0f}. "
                      f"Sudden spike in claim value is a common fraud indicator.")


# ─── Rule 12: Same Claim Type Frequency ──────────────────────────────────────
def check_same_type_frequency(claim: Claim, db: Session):
    """Flag if the user has filed 2+ claims of the same type in 90 days."""
    ninety_days_ago = date.today() - timedelta(days=90)
    same_type_count = db.query(Claim).filter(
        Claim.user_id == claim.user_id,
        Claim.id != claim.id,
        Claim.claim_type == claim.claim_type,
        Claim.created_at >= ninety_days_ago,
        Claim.status != "rejected"
    ).count()
    if same_type_count >= 2:
        _add_flag(db, claim.id, "SAME_TYPE_FREQ", "medium",
                  f"User has filed {same_type_count} other '{claim.claim_type}' claims in the last 90 days. "
                  f"Repeated same-type claims indicate staged incidents.")


# ─── Rule 13: Claim Type Mismatch with Policy Type ───────────────────────────
def check_inconsistent_claim_type(claim: Claim, db: Session):
    """Flag if claim type does not match the underlying policy type."""
    user_policy = claim.user_policy
    if not user_policy or not user_policy.policy:
        return
    policy_type = (user_policy.policy.policy_type or "").lower().strip()
    claim_type = (claim.claim_type or "").lower().strip()
    # Map: travel policy should have travel claim, auto → auto, health → health, etc.
    compatible = {
        "travel": ["travel"],
        "auto": ["auto"],
        "health": ["health"],
        "home": ["home"],
        "life": ["life"],
    }
    allowed = compatible.get(policy_type, [])
    if allowed and claim_type not in allowed:
        _add_flag(db, claim.id, "INCONSISTENT_TYPE", "high",
                  f"Claim type '{claim.claim_type}' does not match policy type '{user_policy.policy.policy_type}'. "
                  f"A {policy_type} policy can only cover {policy_type} incidents.")


# ─── Rule 14: Short / Vague Description ──────────────────────────────────────
def check_short_description(claim: Claim, db: Session):
    """Flag if the incident description is suspiciously short."""
    desc = (claim.incident_description or "").strip()
    if len(desc) < 15:
        _add_flag(db, claim.id, "SHORT_DESCRIPTION", "low",
                  f"Incident description is only {len(desc)} characters long. "
                  f"Legitimate claims typically have a detailed explanation of what happened.")


# ─── Rule 15: Same-Day Submission ────────────────────────────────────────────
def check_same_day_submit(claim: Claim, db: Session):
    """Flag if the claim was created and submitted on the same day with a high amount."""
    if not claim.created_at:
        return
    created_date = claim.created_at.date() if hasattr(claim.created_at, 'date') else claim.created_at
    if created_date == date.today() and float(claim.amount_claimed) >= 500000:
        _add_flag(db, claim.id, "SAME_DAY_SUBMIT", "low",
                  f"Claim was created and submitted on the same day with a high amount of ₹{claim.amount_claimed}. "
                  f"Rushed submissions without deliberation can indicate opportunistic fraud.")


# ─── Rule 16: Mismatched Document Type ───────────────────────────────────────
def check_inconsistent_document(claim: Claim, db: Session):
    """Flag if the uploaded document does not logically match the claim type."""
    claim_type = (claim.claim_type or "").lower().strip()
    docs = db.query(ClaimDocument).filter(ClaimDocument.claim_id == claim.id).all()
    
    # E.g. auto claim shouldn't usually have "medical_report" unless there's an injury, 
    # but as a strict rule: if only "medical_report" occurs on "auto", flag it.
    for doc in docs:
        doc_type = (doc.doc_type or "").lower().strip()
        
        # Medical report on an auto claim
        if claim_type == "auto" and "medical" in doc_type:
            _add_flag(db, claim.id, "INCONSISTENT_DOC", "medium",
                      f"Uploaded a '{doc.doc_type}' for an '{claim.claim_type}' claim. Medical documents on vehicle claims may require extra scrutiny.")
        
        # Police report on a health claim
        elif claim_type == "health" and "police" in doc_type:
             _add_flag(db, claim.id, "INCONSISTENT_DOC", "medium",
                      f"Uploaded a '{doc.doc_type}' for an '{claim.claim_type}' claim. Police reports are unusual for standard medical visits.")


# ─── Orchestrator ─────────────────────────────────────────────────────────────
def run_fraud_checks(claim: Claim, db: Session):
    """Run all 16 fraud detection rules on a submitted claim."""
    try:
        print(f"[FraudEngine] Starting checks for claim {claim.id} ({claim.claim_type})")
        # Original 8 rules
        check_duplicate_documents(claim.id, db)
        check_suspicious_timing(claim, db)
        check_large_amount(claim, db)
        check_multiple_claims(claim, db)
        check_round_amount(claim, db)
        check_missing_documents(claim, db)
        check_repeat_provider(claim, db)
        check_future_date(claim, db)
        # New 7 rules
        check_expired_policy(claim, db)
        check_new_user_large_claim(claim, db)
        check_amount_spike(claim, db)
        check_same_type_frequency(claim, db)
        check_inconsistent_claim_type(claim, db)
        check_short_description(claim, db)
        check_same_day_submit(claim, db)
        check_inconsistent_document(claim, db)
        
        db.commit()
        db.refresh(claim)
        print(f"[FraudEngine] Finished checks for claim {claim.id}. Total flags: {len(claim.fraud_flags)}")
    except Exception as e:
        # Fraud checks should NEVER crash the main claim submission flow
        db.rollback()
        import traceback
        traceback.print_exc()
        print(f"[FraudEngine] Error running checks for claim {claim.id}: {e}")

