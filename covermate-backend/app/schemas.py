"""
Pydantic Schemas – Request/response validation models.
"""

from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Dict, Any, List


# ━━━━━━━━━━━━━━━━━━ AUTH ━━━━━━━━━━━━━━━━━━

class UserBase(BaseModel):
    name: str
    email: EmailStr
    dob: Optional[date] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    role: str = "user"
    risk_profile: Optional[Dict[str, Any]] = None
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: str


# ━━━━━━━━━━━━━━━━━━ PROFILE ━━━━━━━━━━━━━━━━━━

class UserUpdate(BaseModel):
    name: Optional[str] = None
    dob: Optional[date] = None

class RiskProfileUpdate(BaseModel):
    risk_profile: Dict[str, Any]

class PasswordChange(BaseModel):
    old_password: str
    new_password: str


# ━━━━━━━━━━━━━━━━━━ MESSAGE ━━━━━━━━━━━━━━━━━━

class MessageResponse(BaseModel):
    message: str


# ━━━━━━━━━━━━━━━━━━ POLICY ━━━━━━━━━━━━━━━━━━

class ProviderResponse(BaseModel):
    id: int
    name: str
    country: str
    class Config:
        from_attributes = True

class PolicyResponse(BaseModel):
    id: int
    provider_id: int
    policy_type: str
    title: str
    coverage: Optional[Dict[str, Any]] = None
    premium: float
    term_months: int
    deductible: float
    tnc_url: Optional[str] = None
    provider: Optional[ProviderResponse] = None
    class Config:
        from_attributes = True

class UserPolicyResponse(BaseModel):
    id: int
    policy_number: str
    start_date: date
    end_date: date
    premium: float
    status: str
    auto_renew: bool
    policy: PolicyResponse
    class Config:
        from_attributes = True


# ━━━━━━━━━━━━━━━━━━ PREMIUM CALCULATOR ━━━━━━━━━━━━━━━━━━

class PremiumCalculationRequest(BaseModel):
    policy_id: int
    age: int
    coverage_amount: Optional[float] = None
    term_months: Optional[int] = None
    risk_factor: Optional[float] = None


# ━━━━━━━━━━━━━━━━━━ CLAIMS ━━━━━━━━━━━━━━━━━━

class ClaimCreate(BaseModel):
    user_policy_id: int
    claim_type: Optional[str] = None
    incident_date: Optional[date] = None
    amount_claimed: Optional[Decimal] = None

class ClaimUpdate(BaseModel):
    claim_type: Optional[str] = None
    incident_date: Optional[date] = None
    amount_claimed: Optional[Decimal] = None

class ClaimDocumentResponse(BaseModel):
    id: int
    claim_id: int
    file_url: str
    doc_type: str
    uploaded_at: datetime
    class Config:
        from_attributes = True

class ClaimStatusHistoryResponse(BaseModel):
    id: int
    status: str
    changed_at: datetime
    changed_by: Optional[int] = None
    class Config:
        from_attributes = True

class ClaimResponse(BaseModel):
    id: int
    user_policy_id: int
    claim_number: Optional[str] = None
    claim_type: Optional[str] = None
    incident_date: Optional[date] = None
    amount_claimed: Optional[Decimal] = None
    status: str
    risk_score: Optional[int] = None
    created_at: datetime
    documents: List[ClaimDocumentResponse] = []
    status_history: List[ClaimStatusHistoryResponse] = []
    class Config:
        from_attributes = True


# ━━━━━━━━━━━━━━━━━━ ADMIN ━━━━━━━━━━━━━━━━━━

class AdminDashboardStats(BaseModel):
    total_policies: int
    total_user_policies: int
    active_policies: int
    expired_policies: int
    cancelled_policies: int
    total_claims: int
    pending_claims: int
    under_review_claims: int
    total_users: int
    class Config:
        from_attributes = True

class AdminUserSummary(BaseModel):
    id: int
    name: str
    email: str
    class Config:
        from_attributes = True

class AdminUserPolicyOut(BaseModel):
    id: int
    policy_number: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    premium: Optional[float] = None
    status: str
    auto_renew: bool
    user: AdminUserSummary
    policy: PolicyResponse
    class Config:
        from_attributes = True

class AdminUserPolicyWithUser(BaseModel):
    id: int
    policy_number: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    premium: Optional[float] = None
    status: str
    auto_renew: bool
    user: AdminUserSummary          # includes name + email
    policy: PolicyResponse
    class Config:
        from_attributes = True

class FraudFlagOut(BaseModel):
    rule_code: str
    severity: str
    details: Optional[str] = None

    class Config:
        from_attributes = True

class AdminClaimOut(BaseModel):
    id: int
    claim_number: Optional[str] = None
    claim_type: Optional[str] = None
    incident_date: Optional[date] = None
    amount_claimed: Optional[Decimal] = None
    risk_score: Optional[int]
    status: str
    created_at: datetime
    documents: List[ClaimDocumentResponse] = []
    status_history: List[ClaimStatusHistoryResponse] = []
    fraud_flags: List[FraudFlagOut] = []  
    user_policy: AdminUserPolicyWithUser
    class Config:
        from_attributes = True
    

# ✅ note field added back — sent to email
class AdminPolicyStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None

class AdminClaimStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None

class AdminLogOut(BaseModel):
    id: int
    admin_id: int
    action: str
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    timestamp: datetime
    class Config:
        from_attributes = True
