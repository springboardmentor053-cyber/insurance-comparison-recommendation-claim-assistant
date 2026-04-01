
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import csv
import io

from app.api.deps import get_db, get_current_user
from app.crud import crud_claim, crud_user_policy
from app.schemas.claim import ClaimCreate, ClaimUpdate, ClaimOut, ClaimWithDocs, AdminClaimAction, ClaimDocumentOut, PolicyMinimal, UserMinimal
from app.services.s3_service import upload_file_to_s3, delete_file_from_s3, generate_presigned_url
from app.models.claim import Claim, FraudFlag
from app.worker import send_claim_status_email_task

router = APIRouter()


# ─────────────────── USER ENDPOINTS ───────────────────────────────────────────

@router.post("/", summary="Create a draft claim", response_model=ClaimOut)
def create_claim(
    data: ClaimCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Verify the user owns the selected user_policy
    up = crud_user_policy.get_user_policy(db, data.user_policy_id, current_user.id)
    if not up:
        raise HTTPException(status_code=404, detail="Policy not found in your purchased policies")
    if up.status != "active":
        raise HTTPException(status_code=400, detail="You can only claim against an active policy")

    claim = crud_claim.create_claim(db, data, current_user.id)
    return claim


@router.get("/my", summary="List my claims", response_model=List[ClaimOut])
def my_claims(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud_claim.get_user_claims(db, current_user.id)


@router.get("/{claim_id}", summary="Get claim details", response_model=ClaimOut)
def get_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    claim = crud_claim.get_claim(db, claim_id, current_user.id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim


@router.put("/{claim_id}", summary="Update draft claim", response_model=ClaimOut)
def update_claim(
    claim_id: int,
    data: ClaimUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    claim = crud_claim.get_claim(db, claim_id, current_user.id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status != "draft":
        raise HTTPException(status_code=400, detail="Claim already submitted — cannot edit")
    return crud_claim.update_claim(db, claim, data)


@router.post("/{claim_id}/documents", summary="Upload document for a claim")
async def upload_document(
    claim_id: int,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    claim = crud_claim.get_claim(db, claim_id, current_user.id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status not in ("draft",):
        raise HTTPException(status_code=400, detail="Can only upload documents to a draft claim")

    # File validation
    allowed_types = ["image/jpeg", "image/png", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file format. Only JPEG, PNG, and PDF are allowed.")

    if getattr(file, "size", 0) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")

    # Prevent too many documents (sanity check)
    doc_count = crud_claim.count_claim_documents(db, claim_id)
    if doc_count >= 10:
        raise HTTPException(status_code=400, detail="Maximum 10 documents allowed per claim.")

    # Upload to S3
    file_url = upload_file_to_s3(file.file, file.filename, claim_id)

    doc = crud_claim.add_document(db, claim_id, file_url, doc_type)
    return {
        "id": doc.id,
        "claim_id": doc.claim_id,
        "file_url": generate_presigned_url(doc.file_url),
        "doc_type": doc.doc_type,
        "uploaded_at": doc.uploaded_at,
    }

@router.delete("/{claim_id}/documents/{doc_id}", summary="Delete a claim document")
def delete_claim_document(
    claim_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    claim = crud_claim.get_claim(db, claim_id, current_user.id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status != "draft":
        raise HTTPException(status_code=400, detail="Can only delete documents from a draft claim")

    doc = crud_claim.get_document(db, doc_id)
    if not doc or doc.claim_id != claim_id:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete from S3
    delete_file_from_s3(doc.file_url)

    # Delete from database
    crud_claim.delete_document(db, doc)
    return {"message": "Document deleted successfully"}


@router.get("/{claim_id}/documents", summary="Get claim documents")
def get_claim_documents(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    claim = crud_claim.get_claim(db, claim_id, current_user.id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    docs = crud_claim.get_claim_documents(db, claim_id)
    result = []
    for d in docs:
        result.append({
            "id": d.id,
            "claim_id": d.claim_id,
            "file_url": generate_presigned_url(d.file_url),
            "doc_type": d.doc_type,
            "uploaded_at": d.uploaded_at,
        })
    return result


@router.post("/{claim_id}/submit", summary="Submit a draft claim")
def submit_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    claim = crud_claim.get_claim(db, claim_id, current_user.id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status != "draft":
        raise HTTPException(status_code=400, detail="Claim is already submitted")

    doc_count = crud_claim.count_claim_documents(db, claim_id)
    if doc_count == 0:
        raise HTTPException(
            status_code=400,
            detail="Please upload at least one supporting document before submitting",
        )

    claim = crud_claim.submit_claim(db, claim)
    return {"message": "Claim submitted successfully", "claim_number": claim.claim_number}


# ─────────────────── ADMIN ENDPOINTS ──────────────────────────────────────────

@router.get("/admin/stats", summary="[Admin] Dashboard statistics")
def admin_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    from sqlalchemy import func
    from app.models.claim import Claim
    from decimal import Decimal

    statuses = ["draft", "submitted", "under_review", "approved", "rejected", "paid"]
    counts = {}
    for s in statuses:
        counts[s] = db.query(Claim).filter(Claim.status == s).count()

    total_claimed = db.query(func.sum(Claim.amount_claimed)).scalar() or Decimal("0")
    total_approved = db.query(func.sum(Claim.amount_approved)).filter(
        Claim.status.in_(["approved", "paid"])
    ).scalar() or Decimal("0")
    total_paid = db.query(func.sum(Claim.amount_approved)).filter(
        Claim.status == "paid"
    ).scalar() or Decimal("0")
    total_claims = db.query(Claim).count()

    return {
        "total_claims": total_claims,
        "counts": counts,
        "total_claimed": float(total_claimed),
        "total_approved": float(total_approved),
        "total_paid": float(total_paid),
        "pending_action": counts.get("submitted", 0) + counts.get("under_review", 0),
        "flagged_claims": db.query(Claim).join(FraudFlag).filter(Claim.status.in_(["submitted", "under_review"])).distinct().count(),
        "approved_count": counts.get("approved", 0),
        "rejected_count": counts.get("rejected", 0),
    }


@router.get("/admin/all", summary="[Admin] List all claims with user + policy info")
def admin_list_claims(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    from sqlalchemy.orm import joinedload
    from app.models.user_policy import UserPolicy
    from app.models.policy import Policy
    from app.models.user import User as UserModel

    claims = (
        db.query(Claim)
        .options(
            joinedload(Claim.user),
            joinedload(Claim.user_policy).joinedload(UserPolicy.policy),
            joinedload(Claim.fraud_flags),
        )
        .order_by(Claim.created_at.desc())
        .all()
    )
    result = []
    for claim in claims:
        policy = claim.user_policy.policy if claim.user_policy else None
        result.append({
            "id": claim.id,
            "claim_number": claim.claim_number,
            "status": claim.status,
            "claim_type": claim.claim_type,
            "incident_date": claim.incident_date,
            "amount_claimed": float(claim.amount_claimed),
            "amount_approved": float(claim.amount_approved) if claim.amount_approved else None,
            "admin_notes": claim.admin_notes,
            "created_at": claim.created_at,
            "user": {
                "id": claim.user.id,
                "name": claim.user.name,
                "email": claim.user.email,
            } if claim.user else None,
            "policy": {
                "id": policy.id,
                "title": policy.title,
                "policy_type": policy.policy_type.value if hasattr(policy.policy_type, 'value') else policy.policy_type,
            } if policy else None,
            "fraud_flags": [
                {
                    "rule_code": f.rule_code,
                    "severity": f.severity,
                    "details": f.details
                } for f in getattr(claim, 'fraud_flags', [])
            ]
        })
    return result


# ─── Static admin routes MUST be declared before /admin/{claim_id} ───────────

@router.get("/admin/fraud-flags", summary="[Admin] Get all fraud flags")
def get_all_fraud_flags(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    flags = db.query(FraudFlag).order_by(FraudFlag.created_at.desc()).all()
    result = []
    for flag in flags:
        claim = flag.claim
        result.append({
            "id": flag.id,
            "claim_id": flag.claim_id,
            "claim_number": claim.claim_number if claim else None,
            "user_name": claim.user.name if claim and claim.user else None,
            "user_email": claim.user.email if claim and claim.user else None,
            "rule_code": flag.rule_code,
            "severity": flag.severity,
            "details": flag.details,
            "is_reviewed": flag.is_reviewed,
            "reviewed_by": flag.reviewed_by,
            "created_at": flag.created_at,
        })
    return result


@router.put("/admin/fraud-flags/{flag_id}/review", summary="[Admin] Mark fraud flag as reviewed")
def review_fraud_flag(
    flag_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    if status not in ["cleared", "confirmed", "pending"]:
        raise HTTPException(status_code=400, detail="Status must be: cleared, confirmed, or pending")
    flag = db.query(FraudFlag).filter(FraudFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    flag.is_reviewed = status
    flag.reviewed_by = current_user.name or current_user.email
    db.commit()
    db.refresh(flag)
    return {"message": f"Flag marked as {status}", "flag_id": flag_id}


@router.get("/admin/export/claims.csv", summary="[Admin] Export claims as CSV with optional date range")
def export_claims_csv(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    from datetime import datetime as dt
    query = db.query(Claim)
    if from_date:
        try:
            query = query.filter(Claim.created_at >= dt.strptime(from_date, "%Y-%m-%d"))
        except ValueError:
            raise HTTPException(status_code=400, detail="from_date must be YYYY-MM-DD")
    if to_date:
        try:
            query = query.filter(Claim.created_at <= dt.strptime(to_date + " 23:59:59", "%Y-%m-%d %H:%M:%S"))
        except ValueError:
            raise HTTPException(status_code=400, detail="to_date must be YYYY-MM-DD")
    claims = query.order_by(Claim.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Claim Number", "User Name", "User Email",
        "Claim Type", "Incident Date", "Amount Claimed", "Amount Approved",
        "Status", "Admin Notes", "Fraud Flags", "Submitted At"
    ])
    for c in claims:
        fraud_codes = ", ".join([f.rule_code for f in c.fraud_flags]) if c.fraud_flags else "None"
        writer.writerow([
            c.claim_number,
            c.user.name if c.user else "",
            c.user.email if c.user else "",
            c.claim_type,
            c.incident_date,
            float(c.amount_claimed),
            float(c.amount_approved) if c.amount_approved else "",
            c.status,
            c.admin_notes or "",
            fraud_codes,
            c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else "",
        ])
    output.seek(0)
    date_label = f"{from_date or 'all'}_to_{to_date or 'all'}"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=claims_{date_label}.csv"}
    )


@router.get("/admin/{claim_id}", summary="[Admin] Get full claim details", response_model=ClaimWithDocs)
def admin_get_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    from sqlalchemy.orm import joinedload
    from app.models.user_policy import UserPolicy
    from app.models.policy import Policy
    
    claim = (
        db.query(Claim)
        .options(
            joinedload(Claim.user),
            joinedload(Claim.user_policy).joinedload(UserPolicy.policy),
            joinedload(Claim.fraud_flags),
            joinedload(Claim.history)
        )
        .filter(Claim.id == claim_id)
        .first()
    )
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Refresh documents with presigned URLs
    db_docs = crud_claim.get_claim_documents(db, claim_id)
    
    # Use Pydantic to serialize but customize the documents list
    result = ClaimWithDocs.model_validate(claim)
    
    # Manually populate fields that are not automatically mapped by model_validate 
    # if they aren't direct attributes of the model or need specific casting
    if claim.user:
        result.user = UserMinimal.model_validate(claim.user)
        
    if claim.user_policy and claim.user_policy.policy:
        result.policy = PolicyMinimal.model_validate(claim.user_policy.policy)

    result.documents = [
        ClaimDocumentOut(
            id=d.id,
            claim_id=d.claim_id,
            file_url=generate_presigned_url(d.file_url),
            doc_type=d.doc_type,
            uploaded_at=d.uploaded_at
        )
        for d in db_docs
    ]
    return result


@router.put("/admin/{claim_id}/review", summary="[Admin] Set claim under review")
def admin_review_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    claim = crud_claim.get_claim_admin(db, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.status not in ["submitted"]:
        raise HTTPException(status_code=400, detail="Only submitted claims can be moved to under review")

    updated_claim = crud_claim.admin_update_claim_status(db, claim, "under_review")
    send_claim_status_email_task.delay(updated_claim.user.email, updated_claim.claim_number, "under_review")
    return updated_claim


@router.put("/admin/{claim_id}/approve", summary="[Admin] Approve a claim")
def admin_approve_claim(
    claim_id: int,
    data: AdminClaimAction,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    claim = crud_claim.get_claim_admin(db, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.status not in ["under_review"]:
        raise HTTPException(status_code=400, detail="Only claims under review can be approved")

    if data.amount_approved is None:
        raise HTTPException(status_code=400, detail="amount_approved is required to approve a claim")

    updated_claim = crud_claim.admin_update_claim_status(
        db, claim, "approved",
        amount_approved=data.amount_approved,
        admin_notes=data.admin_notes,
    )
    send_claim_status_email_task.delay(updated_claim.user.email, updated_claim.claim_number, "approved")
    return updated_claim


@router.put("/admin/{claim_id}/reject", summary="[Admin] Reject a claim")
def admin_reject_claim(
    claim_id: int,
    data: AdminClaimAction,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    claim = crud_claim.get_claim_admin(db, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.status not in ["submitted", "under_review"]:
        raise HTTPException(status_code=400, detail="Only submitted or under review claims can be rejected")

    updated_claim = crud_claim.admin_update_claim_status(
        db, claim, "rejected", admin_notes=data.admin_notes
    )
    send_claim_status_email_task.delay(updated_claim.user.email, updated_claim.claim_number, "rejected")
    return updated_claim


@router.put("/admin/{claim_id}/pay", summary="[Admin] Mark claim as paid")
def admin_pay_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    claim = crud_claim.get_claim_admin(db, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.status not in ["approved"]:
        raise HTTPException(status_code=400, detail="Only approved claims can be marked as paid")

    updated_claim = crud_claim.admin_update_claim_status(db, claim, "paid")
    send_claim_status_email_task.delay(updated_claim.user.email, updated_claim.claim_number, "paid")
    return updated_claim

