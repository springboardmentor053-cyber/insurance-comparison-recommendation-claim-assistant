from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date
from typing import List
from app.database import get_db
from app.models.claim import Claim
from app.models.claim_document import ClaimDocument
from app.models.claim_status_history import ClaimStatusHistory
from app.models.user_policy import UserPolicy
from app.models.user import User
from app.routers.auth import get_current_user
from app.utils.file_handler import save_file
import uuid

router = APIRouter(prefix="/claims", tags=["Claims"])


# ── Schemas ────────────────────────────────────────────────────

class ClaimDraftCreate(BaseModel):
    user_policy_id: int
    claim_type: str

class ClaimDraftUpdate(BaseModel):
    incident_date: date
    amount: float


# ── Claim number generator — CLM-2026-XXXX format ─────────────

def generate_claim_number(db: Session) -> str:
    from datetime import datetime
    year = datetime.utcnow().year
    # Count existing claims this year to get sequence number
    count = db.query(Claim).count() + 1
    return f"CLM-{year}-{str(count).zfill(4)}"


# ── Helper: verify claim ownership ────────────────────────────

def verify_claim_owner(claim: Claim, current_user: User, db: Session):
    user_policy = db.query(UserPolicy).filter(
        UserPolicy.id == claim.user_policy_id,
        UserPolicy.user_id == current_user.id
    ).first()
    if not user_policy:
        raise HTTPException(status_code=403, detail="Access denied")
    return user_policy


# ── Helper: record status change to history ───────────────────

def record_status_history(claim_id: int, status: str, changed_by: str, db: Session):
    history = ClaimStatusHistory(
        claim_id=claim_id,
        status=status,
        changed_by=changed_by
    )
    db.add(history)

# CLAIM CRUD

# ── POST /claims/draft 

@router.post("/draft")
def create_or_resume_draft(
    data: ClaimDraftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_policy = db.query(UserPolicy).filter(
        UserPolicy.id == data.user_policy_id,
        UserPolicy.user_id == current_user.id
    ).first()

    if not user_policy:
        raise HTTPException(status_code=403, detail="You do not own this policy")

    # Resume existing draft if one exists
    existing_draft = db.query(Claim).filter(
        Claim.user_policy_id == data.user_policy_id,
        Claim.status == "draft"
    ).first()

    if existing_draft:
        existing_draft.claim_type = data.claim_type
        db.commit()
        db.refresh(existing_draft)
        return {
            "claim_id": existing_draft.id,
            "claim_number": existing_draft.claim_number,
            "claim_type": existing_draft.claim_type,
            "status": existing_draft.status,
            "resumed": True
        }

    # Create new draft with CLM-YYYY-XXXX number
    claim = Claim(
        claim_number=generate_claim_number(db),
        user_policy_id=data.user_policy_id,
        claim_type=data.claim_type,
        incident_date=None,
        amount_claimed=None,
        status="draft"
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)

    # Record draft creation in history
    record_status_history(claim.id, "draft", "system", db)
    db.commit()

    return {
        "claim_id": claim.id,
        "claim_number": claim.claim_number,
        "claim_type": claim.claim_type,
        "status": claim.status,
        "resumed": False
    }


# ── PUT /claims/{claim_id}/draft 

@router.put("/{claim_id}/draft")
def update_draft(
    claim_id: int,
    data: ClaimDraftUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft claims can be updated")

    verify_claim_owner(claim, current_user, db)

    claim.incident_date = data.incident_date
    claim.amount_claimed = data.amount
    db.commit()
    db.refresh(claim)

    return {
        "claim_id": claim.id,
        "claim_number": claim.claim_number,
        "status": claim.status,
        "incident_date": str(claim.incident_date),
        "amount_claimed": float(claim.amount_claimed)
    }


# ── PATCH /claims/{claim_id}/submit 

@router.patch("/{claim_id}/submit")
def submit_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status != "draft":
        raise HTTPException(status_code=400, detail="This claim has already been submitted")
    if not claim.incident_date or not claim.amount_claimed:
        raise HTTPException(status_code=400, detail="Please complete all claim details before submitting")

    verify_claim_owner(claim, current_user, db)

    # Block if no documents uploaded
    doc_count = db.query(ClaimDocument).filter(
        ClaimDocument.claim_id == claim_id
    ).count()
    if doc_count == 0:
        raise HTTPException(
            status_code=400,
            detail="Please upload at least one supporting document before submitting"
        )

    claim.status = "submitted"
    db.commit()
    db.refresh(claim)

    # Record status change in history
    record_status_history(claim.id, "submitted", "user", db)
    db.commit()

    return {
        "message": "Claim submitted successfully",
        "claim_id": claim.id,
        "claim_number": claim.claim_number,
        "status": claim.status
    }


# DOCUMENT UPLOAD / VIEW / DELETE

@router.post("/{claim_id}/upload")
def upload_document(
    claim_id: int,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status != "draft":
        raise HTTPException(status_code=400, detail="Cannot upload to a submitted claim")

    verify_claim_owner(claim, current_user, db)

    file_url = save_file(file, claim_id)

    document = ClaimDocument(
        claim_id=claim_id,
        file_url=file_url,
        doc_type=doc_type
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    return {
        "message": "Document uploaded successfully",
        "doc_id": document.id,
        "file_url": document.file_url,
        "doc_type": document.doc_type
    }


@router.post("/{claim_id}/documents")
def upload_multiple_documents(
    claim_id: int,
    doc_type: str = Form(...),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status != "draft":
        raise HTTPException(status_code=400, detail="Cannot upload to a submitted claim")

    verify_claim_owner(claim, current_user, db)

    uploaded = []
    for file in files:
        file_url = save_file(file, claim_id)
        doc = ClaimDocument(claim_id=claim_id, file_url=file_url, doc_type=doc_type)
        db.add(doc)
        uploaded.append({"filename": file.filename, "file_url": file_url, "doc_type": doc_type})

    db.commit()
    return {"uploaded_files": uploaded, "count": len(uploaded)}


@router.get("/{claim_id}/documents")
def get_claim_documents(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    verify_claim_owner(claim, current_user, db)

    docs = db.query(ClaimDocument).filter(ClaimDocument.claim_id == claim_id).all()

    return [
        {
            "doc_id": doc.id,
            "file_url": doc.file_url,
            "doc_type": doc.doc_type,
            "filename": doc.file_url.split("/")[-1],
            "uploaded_at": str(doc.uploaded_at)
        }
        for doc in docs
    ]


@router.delete("/documents/{doc_id}")
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(ClaimDocument).filter(ClaimDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    claim = db.query(Claim).filter(Claim.id == doc.claim_id).first()
    if claim.status != "draft":
        raise HTTPException(status_code=400, detail="Cannot delete from a submitted claim")

    verify_claim_owner(claim, current_user, db)

    import os
    file_path = doc.file_url.replace("http://127.0.0.1:8000/", "")
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(doc)
    db.commit()

    return {"message": "Document deleted successfully"}


# Timeline of all status changes for a claim

@router.get("/{claim_id}/history")
def get_claim_history(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    verify_claim_owner(claim, current_user, db)

    history = db.query(ClaimStatusHistory).filter(
        ClaimStatusHistory.claim_id == claim_id
    ).order_by(ClaimStatusHistory.changed_at.asc()).all()

    return [
        {
            "status": h.status,
            "changed_by": h.changed_by,
            "changed_at": str(h.changed_at)
        }
        for h in history
    ]

# GET CLAIMS

@router.get("/my-claims")
def get_my_claims(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = (
        db.query(Claim, UserPolicy)
        .join(UserPolicy, UserPolicy.id == Claim.user_policy_id)
        .filter(UserPolicy.user_id == current_user.id)
        .all()
    )

    if not results:
        return []

    return [
        {
            "claim_id": claim.id,
            "claim_number": claim.claim_number,
            "claim_type": claim.claim_type,
            "incident_date": str(claim.incident_date) if claim.incident_date else None,
            "amount_claimed": float(claim.amount_claimed) if claim.amount_claimed else None,
            "status": claim.status,
            "created_at": str(claim.created_at),
            "user_policy_id": user_policy.id
        }
        for claim, user_policy in results
    ]


@router.get("/{claim_id}")
def get_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    verify_claim_owner(claim, current_user, db)

    return {
        "claim_id": claim.id,
        "claim_number": claim.claim_number,
        "claim_type": claim.claim_type,
        "incident_date": str(claim.incident_date) if claim.incident_date else None,
        "amount_claimed": float(claim.amount_claimed) if claim.amount_claimed else None,
        "status": claim.status,
        "created_at": str(claim.created_at)
    }