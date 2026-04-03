from sqlalchemy.orm import Session
from database import Claim, ClaimDocument, Policy, FraudFlag
from datetime import datetime, timedelta

def check_duplicate_documents(claim_id, db: Session):
    """
    Check if same document (by file hash/name) exists in another claim
    """
    # Get all documents for this claim
    docs = db.query(ClaimDocument).filter(
        ClaimDocument.claim_id == claim_id
    ).all()
    
    for doc in docs:
        # Check if same file_name exists in different claim
        duplicate = db.query(ClaimDocument).filter(
            ClaimDocument.file_name == doc.file_name,
            ClaimDocument.claim_id != claim_id
        ).first()
        
        if duplicate:
            # Create fraud flag
            flag = FraudFlag(
                claim_id=claim_id,
                rule_code="DUP_DOC",
                severity="high",
                details=f"Duplicate document detected: {doc.file_name} already exists in claim {duplicate.claim_id}"
            )
            db.add(flag)
            db.commit()
            return True
    
    return False


def check_suspicious_timing(claim_id, db: Session):
    """
    Check if claim was filed too soon after policy start
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        return False
    
    policy = db.query(Policy).filter(Policy.id == claim.policy_id).first()
    if not policy:
        return False
    
    # Assume policy has a start_date field (you may need to add this)
    # For now, we'll check if claim was filed within 2 days of creation
    days_diff = (claim.filed_date - claim.filed_date).days  # This is simplified
    
    # If claim filed very soon after policy start (< 2 days)
    if days_diff < 2:
        flag = FraudFlag(
            claim_id=claim_id,
            rule_code="SUSPICIOUS_TIMING",
            severity="medium",
            details=f"Claim filed only {days_diff} days after policy start"
        )
        db.add(flag)
        db.commit()
        return True
    
    return False


def check_high_amount(claim_id, db: Session):
    """
    Check if claim amount exceeds policy coverage
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        return False
    
    policy = db.query(Policy).filter(Policy.id == claim.policy_id).first()
    if not policy:
        return False
    
    # Check if claim amount exceeds coverage
    if claim.claim_amount > policy.coverage_amount:
        flag = FraudFlag(
            claim_id=claim_id,
            rule_code="HIGH_AMOUNT",
            severity="medium",
            details=f"Claim amount ${claim.claim_amount} exceeds policy coverage ${policy.coverage_amount}"
        )
        db.add(flag)
        db.commit()
        return True
    
    # Also flag if claim is suspiciously high (>80% of coverage)
    if claim.claim_amount > (policy.coverage_amount * 0.8):
        flag = FraudFlag(
            claim_id=claim_id,
            rule_code="HIGH_AMOUNT",
            severity="low",
            details=f"Claim amount ${claim.claim_amount} is {(claim.claim_amount/policy.coverage_amount*100):.1f}% of policy coverage"
        )
        db.add(flag)
        db.commit()
        return True
    
    return False


def run_fraud_checks(claim_id, db: Session):
    """
    Run all fraud checks on a claim
    Returns: dict with results
    """
    results = {
        "claim_id": claim_id,
        "flags_created": 0,
        "checks_run": []
    }
    
    # Run all checks
    if check_duplicate_documents(claim_id, db):
        results["flags_created"] += 1
        results["checks_run"].append("duplicate_documents")
    
    if check_suspicious_timing(claim_id, db):
        results["flags_created"] += 1
        results["checks_run"].append("suspicious_timing")
    
    if check_high_amount(claim_id, db):
        results["flags_created"] += 1
        results["checks_run"].append("high_amount")
    
    return results


def get_fraud_flags(claim_id, db: Session):
    """
    Get all fraud flags for a claim
    """
    flags = db.query(FraudFlag).filter(
        FraudFlag.claim_id == claim_id,
        FraudFlag.resolved == False
    ).all()
    
    return flags