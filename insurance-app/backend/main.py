from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
import csv
import io

from database import (get_db, User, Provider, Policy, init_db,
                      UserPreference, Recommendation, Claim,
                      ClaimStatusHistory, ClaimDocument, FraudFlag)
from models import (UserCreate, UserResponse, Token, PolicyResponse,
                    ProviderResponse, UserPreferenceCreate, UserPreferenceResponse,
                    RecommendationResponse, ClaimCreate, ClaimResponse,
                    ClaimUpdate, ClaimStatusUpdate, ClaimDocumentResponse,
                    ClaimStatusHistoryResponse, FraudFlagResponse)
from auth import (get_password_hash, authenticate_user, create_access_token,
                  get_current_user, get_admin_user)
from recommendation_engine import generate_recommendations
from file_storage import save_claim_document, delete_claim_document
from fraud_engine import run_fraud_checks
from celery_worker import send_email_task

app = FastAPI(title="Insurance Comparison API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()
    print("✅ Database initialized!")

@app.get("/")
def read_root():
    return {"message": "Insurance Comparison API", "status": "running"}

def generate_claim_number(db: Session):
    year = datetime.now().year
    count = db.query(Claim).filter(
        Claim.claim_number.like(f"CLM-{year}-%")
    ).count()
    return f"CLM-{year}-{str(count + 1).zfill(4)}"

# ==================== AUTH ====================

@app.post("/auth/signup", response_model=UserResponse,
          status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(),
          db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ==================== PROVIDERS ====================

@app.get("/providers", response_model=List[ProviderResponse])
def get_providers(db: Session = Depends(get_db)):
    return db.query(Provider).all()

@app.get("/providers/{provider_id}", response_model=ProviderResponse)
def get_provider(provider_id: int, db: Session = Depends(get_db)):
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider

# ==================== POLICIES ====================

@app.get("/policies", response_model=List[PolicyResponse])
def get_policies(
    policy_type: str = None,
    min_coverage: float = None,
    max_premium: float = None,
    db: Session = Depends(get_db)
):
    query = db.query(Policy)
    if policy_type:
        query = query.filter(Policy.type == policy_type)
    if min_coverage:
        query = query.filter(Policy.coverage_amount >= min_coverage)
    if max_premium:
        query = query.filter(Policy.premium_monthly <= max_premium)
    return query.all()

@app.get("/policies/{policy_id}", response_model=PolicyResponse)
def get_policy(policy_id: int, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy

@app.get("/policies/type/{policy_type}", response_model=List[PolicyResponse])
def get_policies_by_type(policy_type: str, db: Session = Depends(get_db)):
    return db.query(Policy).filter(Policy.type == policy_type).all()

# ==================== PREFERENCES ====================

@app.post("/preferences", response_model=UserPreferenceResponse)
def create_or_update_preferences(
    preferences: UserPreferenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(UserPreference).filter(
        UserPreference.user_id == current_user.id
    ).first()
    if existing:
        for key, value in preferences.dict().items():
            setattr(existing, key, value)
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    new_pref = UserPreference(user_id=current_user.id, **preferences.dict())
    db.add(new_pref)
    db.commit()
    db.refresh(new_pref)
    return new_pref

@app.get("/preferences", response_model=UserPreferenceResponse)
def get_my_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    preferences = db.query(UserPreference).filter(
        UserPreference.user_id == current_user.id
    ).first()
    if not preferences:
        raise HTTPException(status_code=404, detail="Preferences not found")
    return preferences

# ==================== RECOMMENDATIONS ====================

@app.post("/recommendations/generate")
def create_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = generate_recommendations(current_user.id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return {
        "message": f"Generated {result['count']} recommendations",
        "count": result['count']
    }

@app.get("/recommendations", response_model=List[RecommendationResponse])
def get_my_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    recommendations = db.query(Recommendation).filter(
        Recommendation.user_id == current_user.id
    ).order_by(Recommendation.score.desc()).all()
    if not recommendations:
        raise HTTPException(status_code=404, detail="No recommendations found")
    return recommendations

# ==================== CLAIMS ====================

@app.post("/claims", response_model=ClaimResponse,
          status_code=status.HTTP_201_CREATED)
def file_claim(
    claim: ClaimCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    policy = db.query(Policy).filter(Policy.id == claim.policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    claim_number = generate_claim_number(db)
    new_claim = Claim(
        claim_number=claim_number,
        user_id=current_user.id,
        policy_id=claim.policy_id,
        claim_type=claim.claim_type,
        claim_amount=claim.claim_amount,
        amount_claimed=claim.claim_amount,
        description=claim.description,
        incident_date=claim.incident_date,
        status="draft"
    )
    db.add(new_claim)
    db.commit()
    db.refresh(new_claim)

    status_history = ClaimStatusHistory(
        claim_id=new_claim.id,
        old_status=None,
        new_status="draft",
        changed_by=current_user.id,
        notes="Claim created"
    )
    db.add(status_history)
    db.commit()
    return new_claim

@app.get("/claims", response_model=List[ClaimResponse])
def get_my_claims(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Claim).filter(
        Claim.user_id == current_user.id
    ).order_by(Claim.filed_date.desc()).all()

@app.get("/claims/{claim_id}", response_model=ClaimResponse)
def get_claim(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(
        Claim.id == claim_id,
        Claim.user_id == current_user.id
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim

@app.post("/claims/{claim_id}/submit")
def submit_claim(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(
        Claim.id == claim_id,
        Claim.user_id == current_user.id
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status != "draft":
        raise HTTPException(
            status_code=400,
            detail="Only draft claims can be submitted"
        )

    old_status = claim.status
    claim.status = "submitted"
    claim.submitted_date = datetime.utcnow()
    claim.updated_date = datetime.utcnow()

    status_history = ClaimStatusHistory(
        claim_id=claim.id,
        old_status=old_status,
        new_status="submitted",
        changed_by=current_user.id,
        notes="Claim submitted by user"
    )
    db.add(status_history)
    db.commit()
    db.refresh(claim)

    # Auto fraud check on submission
    fraud_result = run_fraud_checks(claim.id, db)

    return {
        "message": "Claim submitted successfully",
        "claim_number": claim.claim_number,
        "fraud_check": {
            "risk_level": fraud_result.get("risk_level", "clean"),
            "flags_found": fraud_result.get("flags_found", 0)
        }
    }

# ==================== FILE UPLOAD ====================

@app.post("/claims/{claim_id}/upload",
          response_model=ClaimDocumentResponse)
def upload_claim_document(
    claim_id: int,
    file: UploadFile = File(...),
    file_type: str = "other",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(
        Claim.id == claim_id,
        Claim.user_id == current_user.id
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    file_info = save_claim_document(file, claim_id, file_type)

    document = ClaimDocument(
        claim_id=claim_id,
        file_name=file_info["file_name"],
        file_path=file_info["file_path"],
        file_url=file_info.get("file_url"),
        file_type=file_type,
        file_size=file_info["file_size"],
        file_hash=file_info.get("file_hash")
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document

@app.get("/claims/{claim_id}/documents",
         response_model=List[ClaimDocumentResponse])
def get_claim_documents(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(
        Claim.id == claim_id,
        Claim.user_id == current_user.id
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return db.query(ClaimDocument).filter(
        ClaimDocument.claim_id == claim_id
    ).all()

@app.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = db.query(ClaimDocument).filter(
        ClaimDocument.id == document_id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    claim = db.query(Claim).filter(
        Claim.id == document.claim_id,
        Claim.user_id == current_user.id
    ).first()
    if not claim:
        raise HTTPException(status_code=403, detail="Not authorized")
    delete_claim_document(document.file_path)
    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}

# ==================== CLAIM STATUS ====================

@app.put("/admin/claims/{claim_id}/status")
def update_claim_status_admin(
    claim_id: int,
    status_update: ClaimStatusUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    valid_transitions = {
        "draft": ["submitted"],
        "submitted": ["under_review", "rejected"],
        "under_review": ["approved", "rejected"],
        "approved": ["paid"],
        "rejected": [],
        "paid": []
    }

    if status_update.status not in valid_transitions.get(claim.status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from {claim.status} to {status_update.status}"
        )

    old_status = claim.status
    claim.status = status_update.status
    claim.updated_date = datetime.utcnow()
    if status_update.notes:
        claim.admin_notes = status_update.notes

    status_history = ClaimStatusHistory(
        claim_id=claim.id,
        old_status=old_status,
        new_status=status_update.status,
        changed_by=current_user.id,
        notes=status_update.notes
    )
    db.add(status_history)
    db.commit()
    db.refresh(claim)

    # Send email notification
    user = db.query(User).filter(User.id == claim.user_id).first()
    if user:
        message = f"""Hello {user.full_name},

Your claim {claim.claim_number} status has been updated.

Current Status: {status_update.status}

{f'Admin Notes: {status_update.notes}' if status_update.notes else ''}

Thank you,
Insurance Team"""
        send_email_task.delay(
            user.email,
            f"Claim {claim.claim_number} Status Update",
            message
        )

    return {"message": "Claim status updated", "new_status": claim.status}

@app.get("/claims/{claim_id}/history",
         response_model=List[ClaimStatusHistoryResponse])
def get_claim_history(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(
        Claim.id == claim_id,
        Claim.user_id == current_user.id
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return db.query(ClaimStatusHistory).filter(
        ClaimStatusHistory.claim_id == claim_id
    ).order_by(ClaimStatusHistory.changed_at.asc()).all()

# ==================== FRAUD ====================

@app.post("/claims/{claim_id}/analyze")
def analyze_claim_fraud(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    result = run_fraud_checks(claim_id, db)
    return result

@app.get("/claims/{claim_id}/flags",
         response_model=List[FraudFlagResponse])
def get_claim_flags(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return db.query(FraudFlag).filter(
        FraudFlag.claim_id == claim_id
    ).all()

# ==================== ADMIN DASHBOARD ====================

@app.get("/admin/dashboard")
def dashboard_stats(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    total = db.query(Claim).count()
    flagged = db.query(FraudFlag.claim_id).distinct().count()
    approved = db.query(Claim).filter(Claim.status == "approved").count()
    rejected = db.query(Claim).filter(Claim.status == "rejected").count()
    paid = db.query(Claim).filter(Claim.status == "paid").count()
    under_review = db.query(Claim).filter(
        Claim.status == "under_review"
    ).count()
    submitted = db.query(Claim).filter(Claim.status == "submitted").count()

    total_payout = db.query(
        func.sum(Claim.claim_amount)
    ).filter(Claim.status.in_(["approved", "paid"])).scalar() or 0.0

    high_risk = db.query(FraudFlag.claim_id).filter(
        FraudFlag.severity == "high"
    ).distinct().count()

    fraud_by_rule = db.query(
        FraudFlag.rule_code,
        func.count(FraudFlag.id).label("count")
    ).group_by(FraudFlag.rule_code).all()

    return {
        "total_claims": total,
        "flagged_claims": flagged,
        "approved_claims": approved,
        "rejected_claims": rejected,
        "paid_claims": paid,
        "under_review_claims": under_review,
        "submitted_claims": submitted,
        "total_payout": round(total_payout, 2),
        "high_risk_claims": high_risk,
        "fraud_by_rule": {r.rule_code: r.count for r in fraud_by_rule}
    }

@app.get("/admin/fraud-flags", response_model=List[FraudFlagResponse])
def get_all_fraud_flags(
    severity: str = None,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    query = db.query(FraudFlag)
    if severity:
        query = query.filter(FraudFlag.severity == severity)
    return query.order_by(FraudFlag.created_at.desc()).all()

# ==================== EXPORT ====================

@app.get("/admin/export/claims")
def export_claims_csv(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    claims = db.query(Claim).order_by(Claim.filed_date.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Claim Number", "User ID", "Policy ID", "Claim Type",
        "Amount", "Status", "Filed Date", "Submitted Date", "Admin Notes"
    ])
    for c in claims:
        writer.writerow([
            c.claim_number, c.user_id, c.policy_id, c.claim_type,
            c.claim_amount, c.status,
            c.filed_date.isoformat() if c.filed_date else "",
            c.submitted_date.isoformat() if c.submitted_date else "",
            c.admin_notes or ""
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=claims_export.csv"
        }
    )

@app.get("/admin/export/fraud-flags")
def export_fraud_csv(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    flags = db.query(FraudFlag).order_by(FraudFlag.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Flag ID", "Claim ID", "Rule Code",
        "Severity", "Details", "Created At"
    ])
    for f in flags:
        writer.writerow([
            f.id, f.claim_id, f.rule_code,
            f.severity, f.details,
            f.created_at.isoformat()
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=fraud_flags_export.csv"
        }
    )

# ==================== HEALTH ====================

@app.get("/health")
def health_check():
    return {"status": "healthy"}