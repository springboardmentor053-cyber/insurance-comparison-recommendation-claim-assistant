"""
Claims Routes – Create, Edit, View, Upload Documents, Submit, Status Update.

Claim lifecycle:
    draft → submitted → under_review → approved / rejected → paid
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user
from app.services.s3_service import upload_file_to_s3, get_presigned_url
from app.tasks import send_claim_submitted_email, send_claim_status_email

router = APIRouter(prefix="/claims", tags=["Claims"])

VALID_STATUSES = ["draft", "submitted", "under_review", "approved", "rejected", "paid"]

# ─────────────────── VALID TRANSITIONS ───────────────────
VALID_TRANSITIONS = {
    "draft":        ["submitted"],
    "submitted":    ["under_review", "approved", "rejected"],   # ✅ admin can skip steps
    "under_review": ["approved", "rejected"],
    "approved":     ["paid"],
    "rejected":     [],
    "paid":         [],
}


# ─────────────────── HELPER ───────────────────
def generate_claim_number(claim_id: int) -> str:
    return f"CLM-{claim_id:05d}"




# ─────────────────── FRAUD ENGINE ───────────────────
def run_fraud_checks(claim: models.Claim, db: Session):

    fraud_flags = []
    risk_score = 0

    # Rule 1 — High Claim Amount
    if claim.amount_claimed and claim.amount_claimed > 100000:
        risk_score += 50
        fraud_flags.append(
            models.FraudFlag(
                claim_id=claim.id,
                rule_code="HIGH_AMOUNT",
                severity="high",
                details="Claim exceeds ₹100000"
            )
        )

    # Rule 2 — Early Claim
    policy = db.query(models.UserPolicy).filter(
        models.UserPolicy.id == claim.user_policy_id
    ).first()

    if policy and policy.start_date:
        days = (datetime.now().date() - policy.start_date).days

        if days < 7:
            risk_score += 30
            fraud_flags.append(
                models.FraudFlag(
                    claim_id=claim.id,
                    rule_code="EARLY_CLAIM",
                    severity="medium",
                    details="Claim filed within 7 days of policy purchase"
                )
            )

    # Rule 3 — Duplicate Claim Amount
    duplicate = db.query(models.Claim).filter(
        models.Claim.user_policy_id == claim.user_policy_id,
        models.Claim.amount_claimed == claim.amount_claimed,
        models.Claim.id != claim.id
    ).first()

    if duplicate:
        risk_score += 30
        fraud_flags.append(
            models.FraudFlag(
                claim_id=claim.id,
                rule_code="DUPLICATE_AMOUNT",
                severity="low",
                details="Same claim amount previously submitted"
            )
        )
    claim.risk_score = risk_score
    return fraud_flags
    

# ─────────────────── GET USER CLAIMS ───────────────────
@router.get("/", response_model=list[schemas.ClaimResponse])
def get_my_claims(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    claims = (
        db.query(models.Claim)
        .join(models.UserPolicy)
        .filter(models.UserPolicy.user_id == current_user.id)
        .order_by(models.Claim.created_at.desc())
        .all()
    )
    return claims






# ─────────────────── CREATE CLAIM ───────────────────
@router.post("/", response_model=schemas.ClaimResponse, status_code=status.HTTP_201_CREATED)
def create_claim(
    body: schemas.ClaimCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_policy = db.query(models.UserPolicy).filter(
        models.UserPolicy.id == body.user_policy_id,
        models.UserPolicy.user_id == current_user.id,
    ).first()

    if not user_policy:
        raise HTTPException(status_code=404, detail="Policy not found or does not belong to you")

    new_claim = models.Claim(
        user_policy_id=body.user_policy_id,
        claim_type=body.claim_type,
        incident_date=body.incident_date,
        amount_claimed=body.amount_claimed,
        status="draft",
    )
    db.add(new_claim)
    db.commit()
    db.refresh(new_claim)

    new_claim.claim_number = generate_claim_number(new_claim.id)
    db.commit()
    db.refresh(new_claim)
    # ───────── RUN FRAUD CHECKS ─────────
    fraud_flags = run_fraud_checks(new_claim, db)

    for flag in fraud_flags:
        db.add(flag)

    db.commit()

    return new_claim


# ─────────────────── UPDATE CLAIM ───────────────────
@router.put("/{claim_id}", response_model=schemas.ClaimResponse)
def update_claim(
    claim_id: int,
    body: schemas.ClaimUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.user_policy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to edit this claim")
    if claim.status != "draft":
        raise HTTPException(status_code=400, detail=f"Claim cannot be edited. Current status: {claim.status}")

    if body.claim_type     is not None: claim.claim_type     = body.claim_type
    if body.incident_date  is not None: claim.incident_date  = body.incident_date
    if body.amount_claimed is not None: claim.amount_claimed = body.amount_claimed

    db.commit()
    db.refresh(claim)
    return claim


# ─────────────────── GET CLAIM DETAILS ───────────────────
@router.get("/{claim_id}", response_model=schemas.ClaimResponse)
def get_claim(
    claim_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.user_policy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to view this claim")

    return claim


# ─────────────────── GET CLAIM STATUS HISTORY (timeline) ───────────────────
@router.get("/{claim_id}/history", response_model=list[schemas.ClaimStatusHistoryResponse])
def get_claim_history(
    claim_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.user_policy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to view this claim")

    return claim.status_history


# ─────────────────── GET CLAIM DOCUMENTS ───────────────────
@router.get("/{claim_id}/documents", response_model=list[schemas.ClaimDocumentResponse])
def get_claim_documents(
    claim_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.user_policy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to view these documents")

    return claim.documents


# ─────────────────── UPLOAD DOCUMENT ───────────────────
@router.post("/{claim_id}/documents", response_model=schemas.ClaimDocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    claim_id: int,
    doc_type: str,
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.user_policy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to upload to this claim")
    if claim.status != "draft":
        raise HTTPException(status_code=400, detail="Documents can only be uploaded while claim is in draft")

    allowed_types = ["image/jpeg", "image/png", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPG, PNG and PDF files are allowed")

    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    claim_folder = generate_claim_number(claim.id)
    file_url = upload_file_to_s3(file, folder=f"claims/{claim_folder}")

    new_doc = models.ClaimDocument(
        claim_id=claim_id,
        file_url=file_url,
        doc_type=doc_type,
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc


# ─────────────────── GET PRESIGNED URL ───────────────────
@router.get("/documents/{doc_id}/view")
def get_document_view_url(
    doc_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(models.ClaimDocument).filter(models.ClaimDocument.id == doc_id).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    claim = db.query(models.Claim).filter(models.Claim.id == doc.claim_id).first()

    # ✅ Allow admin OR the claim owner to view documents
    if current_user.role != "admin" and claim.user_policy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    presigned_url = get_presigned_url(doc.file_url)
    return {"url": presigned_url}


# ─────────────────── DELETE DOCUMENT ───────────────────
@router.delete("/documents/{doc_id}", status_code=status.HTTP_200_OK)
def delete_document(
    doc_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(models.ClaimDocument).filter(models.ClaimDocument.id == doc_id).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    claim = db.query(models.Claim).filter(models.Claim.id == doc.claim_id).first()
    if claim.user_policy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this document")

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}


# ─────────────────── UPDATE DOCUMENT ───────────────────
@router.put("/documents/{doc_id}", response_model=schemas.ClaimDocumentResponse)
def update_document(
    doc_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(models.ClaimDocument).filter(models.ClaimDocument.id == doc_id).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    claim = db.query(models.Claim).filter(models.Claim.id == doc.claim_id).first()
    if claim.user_policy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to update this document")

    claim_folder = generate_claim_number(claim.id)
    file_url = upload_file_to_s3(file, folder=f"claims/{claim_folder}")
    doc.file_url = file_url
    db.commit()
    db.refresh(doc)
    return doc


# ─────────────────── SUBMIT CLAIM ───────────────────
@router.post("/{claim_id}/submit", response_model=schemas.ClaimResponse)
def submit_claim(
    claim_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()

    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.user_policy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to submit this claim")
    if claim.status != "draft":
        raise HTTPException(status_code=400, detail=f"Claim is already {claim.status}. Only drafts can be submitted.")
    if not claim.documents:
        raise HTTPException(status_code=400, detail="Please upload at least one supporting document before submitting")

    claim.status = "submitted"
    db.commit()
    db.refresh(claim)
    # ───────── RUN FRAUD CHECKS ─────────
    fraud_flags = run_fraud_checks(claim, db)

    for flag in fraud_flags:
        db.add(flag)

    db.commit()

    history_entry = models.ClaimStatusHistory(
        claim_id=claim.id,
        status="submitted",
        changed_by=current_user.id,
    )
    db.add(history_entry)
    db.commit()

    amount = f"₹{int(claim.amount_claimed):,}" if claim.amount_claimed else "Not specified"
    send_claim_submitted_email.delay(
        user_email   = current_user.email,
        user_name    = current_user.name,
        claim_number = claim.claim_number,
        claim_type   = claim.claim_type or "General",
        amount       = amount,
    )

    return claim


# ─────────────────── UPDATE CLAIM STATUS (admin) ──────────────────────────
@router.put("/{claim_id}/status", response_model=schemas.ClaimResponse)
def update_claim_status(
    claim_id: int,
    new_status: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if new_status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {VALID_STATUSES}")

    claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    allowed = VALID_TRANSITIONS.get(claim.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot move from '{claim.status}' to '{new_status}'. Allowed: {allowed}"
        )

    claim.status = new_status
    db.commit()
    db.refresh(claim)

    history_entry = models.ClaimStatusHistory(
        claim_id=claim.id,
        status=new_status,
        changed_by=current_user.id,
    )
    db.add(history_entry)
    db.commit()

    user = claim.user_policy.user
    send_claim_status_email.delay(
        user_email   = user.email,
        user_name    = user.name,
        claim_number = claim.claim_number,
        new_status   = new_status,
    )

    return claim


