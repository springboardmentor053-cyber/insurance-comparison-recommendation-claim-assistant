import uuid
from sqlalchemy.orm import Session
from app.models.claim import Claim, ClaimDocument, ClaimStatusHistory
from app.schemas.claim import ClaimCreate, ClaimUpdate
from app.services.fraud_engine import run_fraud_checks


def create_claim(db: Session, data: ClaimCreate, user_id: int) -> Claim:
    claim = Claim(
        claim_number=str(uuid.uuid4()),
        user_id=user_id,
        user_policy_id=data.user_policy_id,
        claim_type=data.claim_type,
        incident_date=data.incident_date,
        incident_description=data.incident_description,
        amount_claimed=data.amount_claimed,
        status="draft",
        # Optional fields
        incident_location=data.incident_location,
        third_party_involved=data.third_party_involved,
        police_report_number=data.police_report_number,
        hospital_name=data.hospital_name,
        repair_estimate=data.repair_estimate,
        beneficiary_name=data.beneficiary_name,
        beneficiary_relation=data.beneficiary_relation,
        cause=data.cause,
        trip_destination=data.trip_destination,
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)

    # Log the first status
    history_entry = ClaimStatusHistory(
        claim_id=claim.id,
        status="draft",
        notes="Claim created"
    )
    db.add(history_entry)
    db.commit()

    return claim


def get_claim(db: Session, claim_id: int, user_id: int) -> Claim:
    return db.query(Claim).filter(
        Claim.id == claim_id,
        Claim.user_id == user_id
    ).first()


def get_claim_admin(db: Session, claim_id: int) -> Claim:
    return db.query(Claim).filter(Claim.id == claim_id).first()


def get_user_claims(db: Session, user_id: int):
    return db.query(Claim).filter(Claim.user_id == user_id).order_by(Claim.created_at.desc()).all()


def get_all_claims(db: Session):
    return db.query(Claim).order_by(Claim.created_at.desc()).all()


def update_claim(db: Session, claim: Claim, data: ClaimUpdate) -> Claim:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(claim, field, value)
    db.commit()
    db.refresh(claim)
    return claim


def submit_claim(db: Session, claim: Claim) -> Claim:
    claim.status = "submitted"
    db.commit()
    db.refresh(claim)

    history_entry = ClaimStatusHistory(
        claim_id=claim.id,
        status="submitted",
        notes="Claim submitted for review"
    )
    db.add(history_entry)
    db.commit()

    # ── Run all fraud detection rules automatically ─────────────────
    run_fraud_checks(claim, db)

    return claim


def add_document(db: Session, claim_id: int, file_url: str, doc_type: str) -> ClaimDocument:
    doc = ClaimDocument(
        claim_id=claim_id,
        file_url=file_url,
        doc_type=doc_type,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def get_claim_documents(db: Session, claim_id: int):
    return db.query(ClaimDocument).filter(ClaimDocument.claim_id == claim_id).all()


def get_document(db: Session, doc_id: int) -> ClaimDocument:
    return db.query(ClaimDocument).filter(ClaimDocument.id == doc_id).first()


def delete_document(db: Session, doc: ClaimDocument):
    db.delete(doc)
    db.commit()


def count_claim_documents(db: Session, claim_id: int) -> int:
    return db.query(ClaimDocument).filter(ClaimDocument.claim_id == claim_id).count()


def admin_update_claim_status(
    db: Session, claim: Claim, status: str,
    amount_approved=None, admin_notes=None
) -> Claim:
    claim.status = status
    if amount_approved is not None:
        claim.amount_approved = amount_approved
    if admin_notes is not None:
        claim.admin_notes = admin_notes
    db.commit()
    db.refresh(claim)

    history_entry = ClaimStatusHistory(
        claim_id=claim.id,
        status=status,
        notes=admin_notes or f"Admin updated status to {status.replace('_', ' ')}"
    )
    db.add(history_entry)
    db.commit()

    return claim
