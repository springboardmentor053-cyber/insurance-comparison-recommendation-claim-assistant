from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db, User, Provider, Policy, init_db, UserPreference, Recommendation, Claim
from models import UserCreate, UserResponse, UserLogin, Token, PolicyResponse, ProviderResponse, UserPreferenceCreate, UserPreferenceResponse, RecommendationResponse, ClaimCreate, ClaimResponse, ClaimUpdate
from auth import get_password_hash, authenticate_user, create_access_token, get_current_user
from recommendation_engine import generate_recommendations

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
    
    # Create new claim
    new_claim = Claim(
        user_id=current_user.id,
        policy_id=claim.policy_id,
        claim_type=claim.claim_type,
        claim_amount=claim.claim_amount,
        description=claim.description,
        documents=claim.documents,
        status="pending"
    )
    db.add(new_claim)
    db.commit()
    db.refresh(new_claim)
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

@app.put("/claims/{claim_id}/status", response_model=ClaimResponse)
def update_claim_status(
    claim_id: int,
    claim_update: ClaimUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Update status and admin notes
    claim.status = claim_update.status
    if claim_update.admin_notes:
        claim.admin_notes = claim_update.admin_notes
    claim.updated_date = datetime.utcnow()
    
    db.commit()
    db.refresh(claim)
    return claim

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}