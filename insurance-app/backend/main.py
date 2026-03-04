from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from database import get_db, User, Provider, Policy, init_db
from models import UserCreate, UserResponse, UserLogin, Token, PolicyResponse, ProviderResponse
from auth import get_password_hash, authenticate_user, create_access_token, get_current_user

# Initialize FastAPI app
app = FastAPI(title="Insurance Comparison API")

# CORS Configuration (allows frontend to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React default port
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

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}
