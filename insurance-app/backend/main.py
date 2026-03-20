from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db, User, Provider, Policy, init_db, UserPreference, Recommendation, Claim, ClaimStatusHistory, ClaimDocument
from models import UserCreate, UserResponse, UserLogin, Token, PolicyResponse, ProviderResponse, UserPreferenceCreate, UserPreferenceResponse, RecommendationResponse, ClaimCreate, ClaimResponse, ClaimUpdate, ClaimStatusUpdate, ClaimDocumentResponse, ClaimStatusHistoryResponse
from auth import get_password_hash, authenticate_user, create_access_token, get_current_user
from recommendation_engine import generate_recommendations
from file_storage import save_claim_document, delete_claim_document

# Initialize FastAPI app
app = FastAPI(title="Insurance Comparison API")

# CORS Configuration (allows frontend to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # React default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()
    print("✅ Database initialized!")

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Insurance Comparison API", "status": "running"}

# Helper function to generate claim numbers
def generate_claim_number(db: Session):
    """Generate unique claim number like CLM-2026-0001"""
    year = datetime.now().year
    
    # Get count of claims this year
    count = db.query(Claim).filter(
        Claim.claim_number.like(f"CLM-{year}-%")
    ).count()
    
    # Generate new number
    claim_number = f"CLM-{year}-{str(count + 1).zfill(4)}"
    
    return claim_number

# ==================== AUTH ENDPOINTS ====================

@app.post("/auth/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
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
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
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

# ==================== PROVIDER ENDPOINTS ====================

@app.get("/providers", response_model=List[ProviderResponse])
def get_providers(db: Session = Depends(get_db)):
    providers = db.query(Provider).all()
    return providers

@app.get("/providers/{provider_id}", response_model=ProviderResponse)
def get_provider(provider_id: int, db: Session = Depends(get_db)):
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider

# ==================== POLICY ENDPOINTS ====================

@app.get("/policies", response_model=List[PolicyResponse])
def get_policies(
    policy_type: str = None,
    min_coverage: float = None,
    max_premium: float = None,
    db: Session = Depends(get_db)
):
    query = db.query(Policy)
    
    # Apply filters
    if policy_type:
        query = query.filter(Policy.type == policy_type)
    if min_coverage:
        query = query.filter(Policy.coverage_amount >= min_coverage)
    if max_premium:
        query = query.filter(Policy.premium_monthly <= max_premium)
    
    policies = query.all()
    return policies

@app.get("/policies/{policy_id}", response_model=PolicyResponse)
def get_policy(policy_id: int, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy

@app.get("/policies/type/{policy_type}", response_model=List[PolicyResponse])
def get_policies_by_type(policy_type: str, db: Session = Depends(get_db)):
    policies = db.query(Policy).filter(Policy.type == policy_type).all()
    return policies

# ==================== PREFERENCES ENDPOINTS ====================

@app.post("/preferences", response_model=UserPreferenceResponse)
def create_or_update_preferences(
    preferences: UserPreferenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if preferences already exist
    existing = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    
    if existing:
        # Update existing preferences
        existing.age = preferences.age
        existing.annual_income = preferences.annual_income
        existing.family_size = preferences.family_size
        existing.health_status = preferences.health_status
        existing.preferred_coverage = preferences.preferred_coverage
        existing.max_monthly_budget = preferences.max_monthly_budget
        existing.risk_tolerance = preferences.risk_tolerance
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new preferences
        new_pref = UserPreference(
            user_id=current_user.id,
            age=preferences.age,
            annual_income=preferences.annual_income,
            family_size=preferences.family_size,
            health_status=preferences.health_status,
            preferred_coverage=preferences.preferred_coverage,
            max_monthly_budget=preferences.max_monthly_budget,
            risk_tolerance=preferences.risk_tolerance
        )
        db.add(new_pref)
        db.commit()
        db.refresh(new_pref)
        return new_pref

@app.get("/preferences", response_model=UserPreferenceResponse)
def get_my_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    preferences = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not preferences:
        raise HTTPException(status_code=404, detail="Preferences not found. Please set your preferences first.")
    return preferences

# ==================== RECOMMENDATIONS ENDPOINTS ====================

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
        raise HTTPException(
            status_code=404,
            detail="No recommendations found. Please set your preferences and generate recommendations first."
        )
    
    return recommendations

# ==================== CLAIMS ENDPOINTS ====================

@app.post("/claims", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
def file_claim(
    claim: ClaimCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify policy exists
    policy = db.query(Policy).filter(Policy.id == claim.policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Generate claim number
    claim_number = generate_claim_number(db)
    
    # Create new claim with draft status
    new_claim = Claim(
        claim_number=claim_number,
        user_id=current_user.id,
        policy_id=claim.policy_id,
        claim_type=claim.claim_type,
        claim_amount=claim.claim_amount,
        description=claim.description,
        status="draft"  # Start as draft
    )
    db.add(new_claim)
    db.commit()
    db.refresh(new_claim)
    
    # Add initial status history
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
    claims = db.query(Claim).filter(
        Claim.user_id == current_user.id
    ).order_by(Claim.filed_date.desc()).all()
    
    return claims

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

# ==================== FILE UPLOAD ENDPOINTS ====================

@app.post("/claims/{claim_id}/upload", response_model=ClaimDocumentResponse)
def upload_claim_document(
    claim_id: int,
    file: UploadFile = File(...),
    file_type: str = "other",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a document to a claim"""
    
    # Verify claim exists and belongs to user
    claim = db.query(Claim).filter(
        Claim.id == claim_id,
        Claim.user_id == current_user.id
    ).first()
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Save file
    file_info = save_claim_document(file, claim_id, file_type)
    
    # Create document record
    document = ClaimDocument(
        claim_id=claim_id,
        file_name=file_info["file_name"],
        file_path=file_info["file_path"],
        file_type=file_type,
        file_size=file_info["file_size"]
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    
    return document

@app.get("/claims/{claim_id}/documents", response_model=List[ClaimDocumentResponse])
def get_claim_documents(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all documents for a claim"""
    
    # Verify claim exists and belongs to user
    claim = db.query(Claim).filter(
        Claim.id == claim_id,
        Claim.user_id == current_user.id
    ).first()
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    documents = db.query(ClaimDocument).filter(
        ClaimDocument.claim_id == claim_id
    ).all()
    
    return documents

@app.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a document"""
    
    # Get document
    document = db.query(ClaimDocument).filter(
        ClaimDocument.id == document_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Verify claim belongs to user
    claim = db.query(Claim).filter(
        Claim.id == document.claim_id,
        Claim.user_id == current_user.id
    ).first()
    
    if not claim:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete file from storage
    delete_claim_document(document.file_path)
    
    # Delete from database
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"}

# ==================== CLAIM STATUS ENDPOINTS ====================

@app.post("/claims/{claim_id}/submit")
def submit_claim(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a claim (change from draft to submitted)"""
    
    # Get claim
    claim = db.query(Claim).filter(
        Claim.id == claim_id,
        Claim.user_id == current_user.id
    ).first()
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    if claim.status != "draft":
        raise HTTPException(status_code=400, detail="Can only submit claims in draft status")
    
    # Update status
    old_status = claim.status
    claim.status = "submitted"
    claim.submitted_date = datetime.utcnow()
    claim.updated_date = datetime.utcnow()
    
    # Add to history
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
    
    return {"message": "Claim submitted successfully", "claim_number": claim.claim_number}

@app.put("/admin/claims/{claim_id}/status")
def update_claim_status_admin(
    claim_id: int,
    status_update: ClaimStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin endpoint to update claim status"""
    
    # Get claim
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Valid status transitions
    valid_transitions = {
        "draft": ["submitted"],
        "submitted": ["under_review", "rejected"],
        "under_review": ["approved", "rejected"],
        "approved": ["paid"],
        "rejected": [],
        "paid": []
    }
    
    # Validate transition
    if status_update.status not in valid_transitions.get(claim.status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition from {claim.status} to {status_update.status}"
        )
    
    # Update status
    old_status = claim.status
    claim.status = status_update.status
    claim.updated_date = datetime.utcnow()
    if status_update.notes:
        claim.admin_notes = status_update.notes
    
    # Add to history
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
    
    # TODO: Send email notification (we'll add this in next step)
    
    return {"message": "Claim status updated", "new_status": claim.status}

@app.get("/claims/{claim_id}/history", response_model=List[ClaimStatusHistoryResponse])
def get_claim_history(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get status history for a claim"""
    
    # Verify claim exists and belongs to user
    claim = db.query(Claim).filter(
        Claim.id == claim_id,
        Claim.user_id == current_user.id
    ).first()
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    history = db.query(ClaimStatusHistory).filter(
        ClaimStatusHistory.claim_id == claim_id
    ).order_by(ClaimStatusHistory.changed_at.asc()).all()
    
    return history

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}