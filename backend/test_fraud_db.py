import os
import sys

# Set up app context
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.db.session import SessionLocal
from app.models.claim import Claim, ClaimDocument
from app.crud.crud_claim import submit_claim
from app.services.fraud_engine import evaluate_claim
import datetime
from decimal import Decimal
import random

def seed_fake_claim():
    db = SessionLocal()
    
    unique_num = f"CLM-TESTFRAUD-{random.randint(1000,9999)}"
    
    new_claim = Claim(
        claim_number=unique_num,
        user_id=2,  # from seed.py
        user_policy_id=1,
        claim_type="health",
        incident_date=datetime.date(2026, 3, 31),
        incident_description="Test claim created by verification script to trigger fraud engine",
        amount_claimed=Decimal("800000"),
        status="draft"
    )
    db.add(new_claim)
    db.commit()
    db.refresh(new_claim)

    doc = ClaimDocument(
        claim_id=new_claim.id,
        file_url=f"s3://dummy_bucket/{unique_num}.pdf",
        doc_type="medical_report"
    )
    db.add(doc)
    db.commit()

    # Submit and run fraud engine
    submit_claim(db, new_claim)
    evaluate_claim(db, new_claim.id)
    
    # Reload and print flags
    db.refresh(new_claim)
    print(f"Success! Created claim {new_claim.id} ({new_claim.claim_number})")
    print(f"Detected Fraud Flags: {[f.rule_name for f in new_claim.fraud_flags]}")

if __name__ == "__main__":
    seed_fake_claim()
