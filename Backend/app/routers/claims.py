from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session, joinedload
from app import models, schemas, database
from app.auth import get_current_user
from app.fraud import run_fraud_checks   # <-- new import
from typing import List
import uuid
import random
import shutil
from pathlib import Path
from datetime import date

router = APIRouter(prefix="/claims", tags=["claims"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

def generate_claim_number():
    return f"CLM-{uuid.uuid4().hex[:8].upper()}"

# ---------- User Policies ----------
@router.get("/user-policies", response_model=List[schemas.UserPolicyResponse])
def get_user_policies(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    user_policies = db.query(models.UserPolicy).options(
        joinedload(models.UserPolicy.policy)
    ).filter(
        models.UserPolicy.user_id == current_user.id
    ).all()
    return user_policies

@router.get("/my-policies", response_model=List[schemas.UserPolicyResponse])
def get_my_policies(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    user_policies = db.query(models.UserPolicy).options(
        joinedload(models.UserPolicy.policy)
    ).filter(
        models.UserPolicy.user_id == current_user.id
    ).order_by(models.UserPolicy.created_at.desc()).all()
    return user_policies

@router.post("/buy-policy/{policy_id}")
def buy_policy(
    policy_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    policy = db.query(models.Policy).filter(models.Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    existing = db.query(models.UserPolicy).filter(
        models.UserPolicy.user_id == current_user.id,
        models.UserPolicy.policy_id == policy_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already own this policy")
    user_policy = models.UserPolicy(
        user_id=current_user.id,
        policy_id=policy_id,
        policy_number=f"POL-{random.randint(100000, 999999)}",
        start_date=date.today(),
        end_date=date.today().replace(year=date.today().year + 1),
        premium=policy.premium,
        status="active",
        auto_renew=True
    )
    db.add(user_policy)
    db.commit()
    db.refresh(user_policy)
    return {"message": "Policy purchased successfully", "user_policy_id": user_policy.id}

# ---------- Claims CRUD ----------
@router.post("", response_model=schemas.ClaimResponse, status_code=status.HTTP_201_CREATED)
def create_claim(
    claim_data: schemas.ClaimCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    user_policy = db.query(models.UserPolicy).filter(
        models.UserPolicy.id == claim_data.user_policy_id,
        models.UserPolicy.user_id == current_user.id
    ).first()
    if not user_policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    claim = models.Claim(
        user_policy_id=claim_data.user_policy_id,
        claim_number=generate_claim_number(),
        claim_type=claim_data.claim_type,
        incident_date=claim_data.incident_date,
        description=claim_data.description,
        amount_claimed=claim_data.amount_claimed,
        status="draft"
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim

@router.get("", response_model=List[schemas.ClaimResponse])
def get_my_claims(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    claims = db.query(models.Claim).join(models.UserPolicy).filter(
        models.UserPolicy.user_id == current_user.id
    ).order_by(models.Claim.created_at.desc()).all()
    return claims

@router.get("/{claim_id}", response_model=schemas.ClaimDetailResponse)
def get_claim_detail(
    claim_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    claim = db.query(models.Claim).options(
        joinedload(models.Claim.user_policy).joinedload(models.UserPolicy.policy),
        joinedload(models.Claim.documents)
    ).filter(
        models.Claim.id == claim_id
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.user_policy.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return claim

@router.put("/{claim_id}/submit", response_model=schemas.ClaimResponse)
def submit_claim(
    claim_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    claim = db.query(models.Claim).join(models.UserPolicy).filter(
        models.Claim.id == claim_id,
        models.UserPolicy.user_id == current_user.id
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status != "draft":
        raise HTTPException(status_code=400, detail=f"Claim already {claim.status}")
    claim.status = "submitted"
    db.commit()

    # Run fraud checks
    run_fraud_checks(claim_id, db)

    db.refresh(claim)
    return claim

@router.put("/{claim_id}", response_model=schemas.ClaimResponse)
def update_claim(
    claim_id: int,
    update_data: schemas.ClaimUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    claim = db.query(models.Claim).join(models.UserPolicy).filter(
        models.Claim.id == claim_id,
        models.UserPolicy.user_id == current_user.id
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status != "draft":
        raise HTTPException(status_code=400, detail="Cannot update non-draft claim")
    if update_data.amount_claimed is not None:
        claim.amount_claimed = update_data.amount_claimed
    if update_data.description is not None:
        claim.description = update_data.description
    if hasattr(update_data, 'claim_type') and update_data.claim_type is not None:
        claim.claim_type = update_data.claim_type
    if hasattr(update_data, 'incident_date') and update_data.incident_date is not None:
        claim.incident_date = update_data.incident_date
    db.commit()
    db.refresh(claim)
    return claim

# ---------- Document Upload (single) ----------
@router.post("/{claim_id}/documents", response_model=schemas.ClaimDocumentResponse)
async def upload_document(
    claim_id: int,
    doc_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    claim = db.query(models.Claim).join(models.UserPolicy).filter(
        models.Claim.id == claim_id,
        models.UserPolicy.user_id == current_user.id
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    filename = f"{claim_id}_{uuid.uuid4().hex}_{file.filename}"
    file_path = UPLOAD_DIR / filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    file_url = f"http://localhost:8000/uploads/{filename}"
    doc = models.ClaimDocument(
        claim_id=claim_id,
        file_url=file_url,
        doc_type=doc_type
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

# ---------- Document Upload (multiple) ----------
@router.post("/{claim_id}/documents/multiple", response_model=List[schemas.ClaimDocumentResponse])
async def upload_multiple_documents(
    claim_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    claim = db.query(models.Claim).join(models.UserPolicy).filter(
        models.Claim.id == claim_id,
        models.UserPolicy.user_id == current_user.id
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    uploaded_docs = []
    for file in files:
        filename = f"{claim_id}_{uuid.uuid4().hex}_{file.filename}"
        file_path = UPLOAD_DIR / filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_url = f"http://localhost:8000/uploads/{filename}"
        doc = models.ClaimDocument(
            claim_id=claim_id,
            file_url=file_url,
            doc_type="claim_document"
        )
        db.add(doc)
        uploaded_docs.append(doc)
    db.commit()
    for doc in uploaded_docs:
        db.refresh(doc)
    return uploaded_docs

@router.get("/{claim_id}/documents", response_model=List[schemas.ClaimDocumentResponse])
def get_claim_documents(
    claim_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    claim = db.query(models.Claim).join(models.UserPolicy).filter(
        models.Claim.id == claim_id,
        models.UserPolicy.user_id == current_user.id
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim.documents