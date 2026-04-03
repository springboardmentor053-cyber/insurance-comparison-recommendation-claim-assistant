from sqlalchemy.orm import Session
from app import models
from datetime import date, datetime, timedelta

def check_duplicate_documents(claim_id: int, db: Session):
    """Flag if any document already exists in another claim."""
    docs = db.query(models.ClaimDocument).filter(
        models.ClaimDocument.claim_id == claim_id
    ).all()
    for doc in docs:
        duplicate = db.query(models.ClaimDocument).filter(
            models.ClaimDocument.file_url == doc.file_url,
            models.ClaimDocument.claim_id != claim_id
        ).first()
        if duplicate:
            flag = models.FraudFlag(
                claim_id=claim_id,
                rule_code="DUP_DOC",
                severity="high",
                details="Duplicate document detected"
            )
            db.add(flag)
            db.commit()
            break  # one flag per claim is enough

def check_suspicious_timing(claim: models.Claim, db: Session):
    """Flag if incident occurred within 2 days of policy start."""
    user_policy = claim.user_policy
    if user_policy and user_policy.start_date:
        days_diff = (claim.incident_date - user_policy.start_date).days
        if days_diff < 2:
            flag = models.FraudFlag(
                claim_id=claim.id,
                rule_code="EARLY_CLAIM",
                severity="medium",
                details=f"Claim filed {days_diff} days after policy start"
            )
            db.add(flag)
            db.commit()
            return True
    return False

def check_large_amount(claim: models.Claim, db: Session):
    """Flag if claim amount exceeds policy coverage max or a global threshold."""
    policy = claim.user_policy.policy if claim.user_policy else None
    threshold = None
    if policy and policy.coverage and "max" in policy.coverage:
        threshold = policy.coverage["max"]
    else:
        # Fallback threshold: 500,000 INR for demonstration
        threshold = 500000

    if claim.amount_claimed > threshold:
        flag = models.FraudFlag(
            claim_id=claim.id,
            rule_code="HIGH_AMOUNT",
            severity="medium",
            details=f"Claim amount {claim.amount_claimed} exceeds threshold {threshold}"
        )
        db.add(flag)
        db.commit()
        return True
    return False

# ---------- New Rules ----------
def check_same_day_submit(claim: models.Claim, db: Session):
    """Flag if claim was created and submitted on the same day with high amount."""
    # Assuming status changed to 'submitted' on submission; we need creation date.
    if claim.created_at and claim.status == "submitted":
        # Check if submission date is same as creation date
        if claim.created_at.date() == datetime.now().date():
            # High amount threshold (e.g., 500,000)
            if claim.amount_claimed > 500000:
                flag = models.FraudFlag(
                    claim_id=claim.id,
                    rule_code="SAME_DAY_SUBMIT",
                    severity="low",
                    details=f"Claim created and submitted on same day with high amount ₹{claim.amount_claimed}."
                )
                db.add(flag)
                db.commit()
                return True
    return False

def check_short_description(claim: models.Claim, db: Session):
    """Flag if description is too short (less than 20 characters)."""
    if claim.description and len(claim.description) < 20:
        flag = models.FraudFlag(
            claim_id=claim.id,
            rule_code="SHORT_DESCRIPTION",
            severity="low",
            details=f"Incident description is only {len(claim.description)} characters long."
        )
        db.add(flag)
        db.commit()
        return True
    return False

def check_new_user_large(claim: models.Claim, db: Session):
    """Flag if user is new (< 7 days) and claim amount exceeds 50% of coverage max."""
    user = claim.user_policy.user if claim.user_policy else None
    if user and user.created_at:
        account_age = (datetime.now().date() - user.created_at.date()).days
        if account_age < 7:
            # Get coverage max from policy or use fallback
            policy = claim.user_policy.policy
            coverage_max = None
            if policy and policy.coverage and "max" in policy.coverage:
                coverage_max = policy.coverage["max"]
            else:
                coverage_max = 500000  # fallback

            if claim.amount_claimed > coverage_max * 0.5:
                flag = models.FraudFlag(
                    claim_id=claim.id,
                    rule_code="NEW_USER_LARGE",
                    severity="medium",
                    details=f"Account age {account_age} days. Claim amount ₹{claim.amount_claimed} > 50% of coverage ₹{coverage_max}."
                )
                db.add(flag)
                db.commit()
                return True
    return False

def run_fraud_checks(claim_id: int, db: Session):
    """Run all fraud checks on a claim."""
    claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()
    if not claim:
        return

    # Existing checks
    check_duplicate_documents(claim_id, db)
    check_suspicious_timing(claim, db)
    check_large_amount(claim, db)

    # New checks
    check_same_day_submit(claim, db)
    check_short_description(claim, db)
    check_new_user_large(claim, db)