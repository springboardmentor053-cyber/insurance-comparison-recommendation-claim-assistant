from pydantic import BaseModel, EmailStr, validator
from datetime import date, datetime
from typing import Optional, Any, Dict, List

# --------------------- User Schemas ---------------------
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    dob: date
    risk_profile: Optional[Dict[str, Any]] = {}

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    dob: Optional[date]
    risk_profile: Dict[str, Any]
    created_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# --------------------- Policy Schemas ---------------------
class PolicyResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    premium: float
    policy_type: str
    deductible: float
    term_months: int
    coverage: Optional[Dict[str, Any]] = None
    tnc_url: Optional[str] = None
    provider_name: Optional[str] = "Covermate Standard"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --------------------- UserPolicy Schemas (for claims wizard & admin) ---------------------
class UserPolicyResponse(BaseModel):
    id: int
    policy_number: str
    status: str
    start_date: date
    end_date: date
    policy: PolicyResponse
    user: "UserResponse"

    class Config:
        from_attributes = True

# --------------------- Claim Document Schemas ---------------------
class ClaimDocumentResponse(BaseModel):
    id: int
    file_url: str
    doc_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

# --------------------- Fraud Flag Schemas ---------------------
class FraudFlagResponse(BaseModel):
    id: int
    rule_code: str
    severity: str
    details: str
    created_at: datetime

    class Config:
        from_attributes = True

# --------------------- Claim Schemas ---------------------
class ClaimBase(BaseModel):
    user_policy_id: int
    claim_type: str
    incident_date: date
    description: str
    amount_claimed: float

class ClaimCreate(ClaimBase):
    pass

class ClaimUpdate(BaseModel):
    status: Optional[str] = None
    amount_claimed: Optional[float] = None
    description: Optional[str] = None

class ClaimResponse(ClaimBase):
    id: int
    claim_number: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ClaimDetailResponse(ClaimResponse):
    user_policy: UserPolicyResponse
    documents: List[ClaimDocumentResponse] = []
    fraud_flags: List[FraudFlagResponse] = []

    class Config:
        from_attributes = True

# --------------------- Recommendation Schemas ---------------------
class UserPreferences(BaseModel):
    income: Optional[float] = None
    family_size: Optional[int] = 1
    smoker: Optional[bool] = False
    existing_conditions: List[str] = []
    risk_appetite: str = "medium"
    coverage_priority: str = "balanced"
    preferred_policy_types: List[str] = []
    max_budget: Optional[float] = None
    employment_type: Optional[str] = None
    travel_frequency: Optional[str] = None
    vehicle_owned: Optional[bool] = False
    home_owned: Optional[bool] = False

    # ----- Validators to convert empty strings to None -----
    @validator('income', 'max_budget', pre=True)
    def empty_str_to_none(cls, v):
        return None if v == "" else v

    @validator('employment_type', 'travel_frequency', pre=True)
    def empty_str_to_none_str(cls, v):
        return None if v == "" else v

class UserUpdate(BaseModel):
    name: Optional[str] = None
    dob: Optional[date] = None
    risk_profile: Optional[Dict[str, Any]] = None

class RecommendationResponse(BaseModel):
    id: int
    user_id: int
    policy_id: int
    score: float
    reason: str
    created_at: Optional[datetime] = None
    scoring_breakdown: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class RecommendationRequest(BaseModel):
    refresh: bool = False
    limit: int = 10

class ScoringBreakdown(BaseModel):
    coverage_score: float
    premium_score: float
    deductible_score: float
    type_match_score: float
    term_score: float
    total_score: float
    reason: str

# --------------------- Forward References ---------------------
UserPolicyResponse.model_rebuild()
ClaimDetailResponse.model_rebuild()