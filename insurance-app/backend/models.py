from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    is_admin: int = 0

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

class ProviderBase(BaseModel):
    name: str
    description: Optional[str] = None
    rating: float = 0.0

class ProviderResponse(ProviderBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

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

class UserPreferenceBase(BaseModel):
    age: int
    annual_income: float
    family_size: int = 1
    health_status: str
    vehicle_type: Optional[str] = None
    preferred_coverage: float
    max_monthly_budget: float
    risk_tolerance: str = "medium"

class UserPreferenceCreate(UserPreferenceBase):
    pass

class UserPreferenceResponse(UserPreferenceBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

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

class ClaimBase(BaseModel):
    policy_id: int
    claim_type: str
    claim_amount: float
    description: str
    incident_date: Optional[datetime] = None

class ClaimCreate(ClaimBase):
    documents: Optional[str] = None

class ClaimUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None

class ClaimResponse(ClaimBase):
    id: int
    claim_number: Optional[str] = None
    user_id: int
    status: str
    filed_date: datetime
    submitted_date: Optional[datetime] = None
    updated_date: datetime
    admin_notes: Optional[str] = None
    policy: PolicyResponse
    model_config = ConfigDict(from_attributes=True)

class ClaimStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class ClaimStatusHistoryResponse(BaseModel):
    id: int
    claim_id: int
    old_status: Optional[str] = None
    new_status: str
    changed_at: datetime
    notes: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ClaimDocumentCreate(BaseModel):
    file_type: str
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

class FraudFlagResponse(BaseModel):
    id: int
    claim_id: int
    rule_code: str
    severity: str
    details: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)