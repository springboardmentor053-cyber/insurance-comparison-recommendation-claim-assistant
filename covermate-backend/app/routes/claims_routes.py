"""
Claims Routes – File, edit, submit, upload documents, and delete documents.

Endpoints:
    POST   /claims/                       → File a new claim (draft)
    GET    /claims/                       → List my claims
    GET    /claims/{id}                   → Get a single claim & its documents
    PUT    /claims/{id}                   → Edit a draft/submitted claim
    POST   /claims/{id}/submit            → Final submission (validates required docs)
    POST   /claims/{id}/upload            → Upload a document with doc_type
    DELETE /claims/documents/{doc_id}     → Delete a document
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import List
import uuid
import os
import shutil

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user
from app.email_service import dispatch_email
from app.fraud_engine import run_fraud_checks

router = APIRouter(prefix="/claims", tags=["Claims"])

# ─── Constants ───
ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

DOC_TYPE_LABELS = {
    "accident_photo": "Accident Photo",
    "medical_bill": "Medical Bill",
    "repair_bill": "Repair Bill",
    "police_report": "Police Report / FIR",
    "hospital_discharge": "Hospital Discharge Summary",
    "prescription": "Prescription",
    "identity_proof": "Identity Proof",
    "other": "Other",
}

# Required doc types per claim type (customisable)
REQUIRED_DOCS = {
    "accident": ["accident_photo"],
    "medical": ["medical_bill"],
    "theft": ["police_report"],
    "damage": ["accident_photo"],
    "death": [],
    "other": [],
}


def _generate_claim_number(user_id: int, policy_id: int) -> str:
    """Generate a unique claim number like CL-3-7-A1B2."""
    suffix = uuid.uuid4().hex[:4].upper()
    return f"CL-{user_id}-{policy_id}-{suffix}"




def upload_file_to_s3(file: UploadFile, claim_id: int) -> str:
    """
    Simulates uploading a file to S3 by saving locally.
    Bucket structure:  uploads/claims-bucket/claim_{id}/filename
    Returns the URL that the frontend will use to access the file.
    """
    bucket_name = "claims-bucket"
    upload_dir = os.path.join("uploads", bucket_name, f"claim_{claim_id}")
    os.makedirs(upload_dir, exist_ok=True)

    file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
    file_key = f"{uuid.uuid4().hex[:8]}.{file_extension}"
    file_path = os.path.join(upload_dir, file_key)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    finally:
        file.file.close()

    # Simulated S3 URL (served by FastAPI static mount)
    url = f"/api/uploads/{bucket_name}/claim_{claim_id}/{file_key}"
    return url


# ─────────────────── FILE A NEW CLAIM (draft) ───────────────────
@router.post("/", response_model=schemas.ClaimResponse, status_code=201)
def file_claim(
    body: schemas.ClaimCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    File a new insurance claim. Creates in 'draft' status so the user can
    attach documents before final submission.
    """
    # 1. Verify the UserPolicy exists and belongs to the current user
    user_policy = (
        db.query(models.UserPolicy)
        .filter(
            models.UserPolicy.id == body.user_policy_id,
            models.UserPolicy.user_id == current_user.id
        )
        .first()
    )
    if not user_policy:
        raise HTTPException(status_code=404, detail="Enrolled policy not found")
    if user_policy.status != "active":
        raise HTTPException(status_code=400, detail="Cannot file a claim on an inactive policy")

    # 2. Create the claim in draft status
    claim = models.Claim(
        user_policy_id=user_policy.id,
        claim_number=_generate_claim_number(current_user.id, user_policy.policy_id),
        claim_type=body.claim_type,
        incident_date=body.incident_date,
        amount_claimed=body.amount_claimed,
        status="draft"
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)

    # 3. Send email via Celery (.delay() pushes to Redis queue)
    dispatch_email(
        current_user.email,
        f"Claim {claim.claim_number} Created",
        f"Dear {current_user.name},\nYour claim draft for ₹{claim.amount_claimed} has been created. "
        f"Please upload supporting documents and submit."
    )

    return get_claim(claim.id, current_user, db)


# ─────────────────── LIST MY CLAIMS ───────────────────
@router.get("/", response_model=List[schemas.ClaimResponse])
def list_my_claims(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all claims filed by the authenticated user."""
    return (
        db.query(models.Claim)
        .join(models.UserPolicy)
        .filter(models.UserPolicy.user_id == current_user.id)
        .options(
            joinedload(models.Claim.documents),
            joinedload(models.Claim.fraud_flags),
            joinedload(models.Claim.user_policy).joinedload(models.UserPolicy.policy).joinedload(models.Policy.provider)
        )
        .order_by(models.Claim.created_at.desc())
        .all()
    )


# ─────────────────── GET SINGLE CLAIM ───────────────────
@router.get("/{claim_id}", response_model=schemas.ClaimResponse)
def get_claim(
    claim_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get details of a specific claim (must belong to the user)."""
    claim = (
        db.query(models.Claim)
        .join(models.UserPolicy)
        .filter(
            models.Claim.id == claim_id,
            models.UserPolicy.user_id == current_user.id
        )
        .options(
            joinedload(models.Claim.documents),
            joinedload(models.Claim.fraud_flags),
            joinedload(models.Claim.user_policy).joinedload(models.UserPolicy.policy).joinedload(models.Policy.provider)
        )
        .first()
    )
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim


# ─────────────────── EDIT A CLAIM ───────────────────
@router.put("/{claim_id}", response_model=schemas.ClaimResponse)
def update_claim(
    claim_id: int,
    body: schemas.ClaimUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Edit a claim. Only allowed when status is 'draft' or 'submitted'."""
    claim = (
        db.query(models.Claim)
        .join(models.UserPolicy)
        .filter(models.Claim.id == claim_id, models.UserPolicy.user_id == current_user.id)
        .first()
    )
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status not in ("draft", "submitted"):
        raise HTTPException(status_code=400, detail="Cannot edit a claim that is already under review or closed")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(claim, key, value)

    db.commit()
    db.refresh(claim)
    return get_claim(claim.id, current_user, db)


# ─────────────────── FINAL SUBMISSION ───────────────────
@router.post("/{claim_id}/submit", response_model=schemas.ClaimResponse)
def submit_claim(
    claim_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Final claim submission.
    Validates that all required document types for the claim_type are present.
    Changes status from 'draft' → 'submitted'.
    """
    claim = (
        db.query(models.Claim)
        .join(models.UserPolicy)
        .filter(models.Claim.id == claim_id, models.UserPolicy.user_id == current_user.id)
        .first()
    )
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft claims can be submitted")

    # Validate required documents
    docs = db.query(models.ClaimDocument).filter(models.ClaimDocument.claim_id == claim_id).all()
    uploaded_types = [doc.doc_type for doc in docs]

    required = REQUIRED_DOCS.get(claim.claim_type, [])
    missing = [r for r in required if r not in uploaded_types]
    if missing:
        labels = [DOC_TYPE_LABELS.get(m, m) for m in missing]
        raise HTTPException(
            status_code=400,
            detail=f"Missing required documents: {', '.join(labels)}"
        )

    claim.status = "submitted"
    db.commit()
    db.refresh(claim)

    # ── Run fraud detection rules automatically ──
    # This checks for: duplicate docs, suspicious timing, high amount
    run_fraud_checks(claim.id, db)

    # Send email via Celery (.delay() pushes to Redis queue)
    dispatch_email(
        current_user.email,
        f"Claim {claim.claim_number} Submitted",
        f"Dear {current_user.name},\nYour claim for ₹{claim.amount_claimed} has been submitted for review."
    )

    return get_claim(claim.id, current_user, db)


# ─────────────────── UPLOAD DOCUMENT (with doc_type) ───────────────────
@router.post("/{claim_id}/upload", response_model=schemas.ClaimDocumentResponse, status_code=201)
def upload_document(
    claim_id: int,
    doc_type: str = Form(..., description="Document category, e.g. accident_photo, medical_bill"),
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload a supporting document for a claim with a structured doc_type.
    Validates file format (JPEG, PNG, PDF) and size (≤ 10MB).
    Simulates S3 bucket storage locally.
    """
    # 1. Verify claim ownership
    claim = (
        db.query(models.Claim)
        .join(models.UserPolicy)
        .filter(models.Claim.id == claim_id, models.UserPolicy.user_id == current_user.id)
        .first()
    )
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # 2. Validate file content type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid file format. Allowed: JPEG, PNG, PDF")

    # 3. Validate file size (read into memory to check, then reset)
    contents = file.file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
    file.file.seek(0)

    # 4. Validate doc_type
    if doc_type not in DOC_TYPE_LABELS:
        raise HTTPException(status_code=400, detail=f"Invalid doc_type. Allowed: {', '.join(DOC_TYPE_LABELS.keys())}")

    # 5. Upload to simulated S3
    file_url = upload_file_to_s3(file, claim_id)

    # 6. Save to DB
    doc = models.ClaimDocument(
        claim_id=claim.id,
        file_url=file_url,
        doc_type=doc_type
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return doc


# ─────────────────── LEGACY UPLOAD (backward compat) ───────────────────
@router.post("/{claim_id}/documents", response_model=schemas.ClaimDocumentResponse, status_code=201)
def upload_claim_document_legacy(
    claim_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Legacy upload endpoint (no doc_type required). Assigns 'other' as default."""
    claim = (
        db.query(models.Claim)
        .join(models.UserPolicy)
        .filter(models.Claim.id == claim_id, models.UserPolicy.user_id == current_user.id)
        .first()
    )
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Validate
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file format. Allowed: JPEG, PNG, PDF")
    contents = file.file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
    file.file.seek(0)

    file_url = upload_file_to_s3(file, claim_id)

    doc = models.ClaimDocument(
        claim_id=claim.id,
        file_url=file_url,
        doc_type="other"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


# ─────────────────── DELETE DOCUMENT ───────────────────
@router.delete("/documents/{doc_id}")
def delete_document(
    doc_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a supporting document. Only allowed for the claim owner."""
    doc = db.query(models.ClaimDocument).filter(models.ClaimDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Verify the claim belongs to the current user
    claim = (
        db.query(models.Claim)
        .join(models.UserPolicy)
        .filter(models.Claim.id == doc.claim_id, models.UserPolicy.user_id == current_user.id)
        .first()
    )
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Delete the physical file from simulated S3
    # file_url looks like: /api/uploads/claims-bucket/claim_1/abc.jpg
    local_path = doc.file_url.replace("/api/", "")
    if os.path.exists(local_path):
        os.remove(local_path)

    db.delete(doc)
    db.commit()

    return {"message": "Document deleted"}
