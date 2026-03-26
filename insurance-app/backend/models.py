from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

# User Models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    is_admin: bool = False

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

# Provider Models
class ProviderBase(BaseModel):
    name: str
    description: Optional[str] = None
    rating: float = 0.0

class ProviderResponse(ProviderBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

# Policy Models
class PolicyBase(BaseModel):
    name: str
    type: str
    coverage_amount: float
    premium_monthly: float
    deductible: float
    description: Optional[str] = None

class PolicyCreate(PolicyBase):
    provider_id: int

class PolicyResponse(PolicyBase):
    id: int
    provider_id: int
    provider: ProviderResponse
    
    model_config = ConfigDict(from_attributes=True)

# User Preference Models
class UserPreferenceBase(BaseModel):
    age: int
    annual_income: float
    family_size: int = 1
    health_status: str  # excellent, good, fair, poor
    vehicle_type: Optional[str] = None
    preferred_coverage: float
    max_monthly_budget: float
    risk_tolerance: str = "medium"  # low, medium, high

class UserPreferenceCreate(UserPreferenceBase):
    pass

class UserPreferenceResponse(UserPreferenceBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Recommendation Models
class RecommendationBase(BaseModel):
    policy_id: int
    score: float
    reason: str

class RecommendationResponse(RecommendationBase):
    id: int
    user_id: int
    policy: PolicyResponse
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Claim Models
class ClaimBase(BaseModel):
    policy_id: int
    claim_type: str  # accident, illness, property_damage, other
    claim_amount: float
    description: str

class ClaimCreate(ClaimBase):
    documents: Optional[str] = None

class ClaimUpdate(BaseModel):
    status: str  # pending, under_review, approved, rejected
    admin_notes: Optional[str] = None

class ClaimResponse(ClaimBase):
    id: int
    user_id: int
    status: str
    documents: Optional[str] = None
    filed_date: datetime
    updated_date: datetime
    admin_notes: Optional[str] = None
    policy: PolicyResponse
    
    model_config = ConfigDict(from_attributes=True)

    # Claim Status History Models
class ClaimStatusHistoryResponse(BaseModel):
    id: int
    claim_id: int
    old_status: Optional[str] = None
    new_status: str
    changed_at: datetime
    notes: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

# Claim Document Models
class ClaimDocumentCreate(BaseModel):
    file_type: str  # medical_bill, accident_photo, police_report, other
    file_name: str

class ClaimDocumentResponse(BaseModel):
    id: int
    claim_id: int
    file_name: str
    file_path: str
    file_type: str
    file_size: int
    uploaded_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Admin Status Update Model
class ClaimStatusUpdate(BaseModel):
    status: str  # submitted, under_review, approved, rejected, paid
    notes: Optional[str] = None

# Update existing ClaimResponse to include claim_number
class ClaimResponseWithHistory(ClaimResponse):
    claim_number: Optional[str] = None
    submitted_date: Optional[datetime] = None