import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models
from app.fraud import run_fraud_checks

def backfill_fraud():
    db = SessionLocal()
    claims = db.query(models.Claim).filter(models.Claim.status == "submitted").all()
    for claim in claims:
        print(f"Processing claim {claim.id}...")
        run_fraud_checks(claim.id, db)
    db.close()
    print("Done.")

if __name__ == "__main__":
    backfill_fraud()