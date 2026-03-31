from sqlalchemy.orm import Session
from decimal import Decimal
from app.models.claim import Claim, ClaimFraudFlag, ClaimDocument
from app.models.user_policy import UserPolicy

def evaluate_claim(db: Session, claim_id: int):
    """
    Evaluates a submitted claim against fraud detection rules.
    Flags are saved directly to the database.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        return

    # Delete existing flags for idempotency during dev/re-evaluation
    db.query(ClaimFraudFlag).filter(ClaimFraudFlag.claim_id == claim.id).delete()

    # Rule 1: Suspicious Amounts (e.g. > 5,00,000)
    if claim.amount_claimed > Decimal("500000"):
        flag = ClaimFraudFlag(
            claim_id=claim.id,
            rule_name="suspicious_amount",
            description=f"Claimed amount of ₹{claim.amount_claimed:,.2f} is unusually high (exceeds ₹5 Lakhs threshold)."
        )
        db.add(flag)

    # Rule 2: Suspicious Timing (Incident within 30 days of policy start)
    user_policy = db.query(UserPolicy).filter(UserPolicy.id == claim.user_policy_id).first()
    if user_policy and user_policy.purchase_date:
        days_since_purchase = (claim.incident_date - user_policy.purchase_date).days
        if 0 <= days_since_purchase <= 30:
            flag = ClaimFraudFlag(
                claim_id=claim.id,
                rule_name="suspicious_timing",
                description=f"Incident occurred only {days_since_purchase} days after the policy was purchased."
            )
            db.add(flag)

    # Rule 3: Duplicate Documents
    docs = db.query(ClaimDocument).filter(ClaimDocument.claim_id == claim.id).all()
    for doc in docs:
        duplicate = db.query(ClaimDocument).filter(
            ClaimDocument.file_url == doc.file_url,
            ClaimDocument.claim_id != claim.id
        ).first()
        if duplicate:
            flag = ClaimFraudFlag(
                claim_id=claim.id,
                rule_name="duplicate_docs",
                description=f"Document ({doc.doc_type}) exactly matches a file submitted in another claim (ID: {duplicate.claim_id})."
            )
            db.add(flag)
            break  # Flag once per claim for brevity

    db.commit()
