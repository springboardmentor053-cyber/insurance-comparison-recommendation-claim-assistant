"""
Pydantic Schemas – Request/response validation models.

Pydantic schemas are the "gatekeepers" of your API. When a request arrives,
FastAPI uses these schemas to:
  1. Parse the JSON body into a Python object.
  2. Validate every field (type, format, required/optional).
  3. Return clear error messages if anything is wrong.

For responses, schemas control which fields are sent back to the client
(e.g.  we never return the password hash).
"""

from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional, Dict, Any, List


# ━━━━━━━━━━━━━━━━━ GENERIC SCHEMAS ━━━━━━━━━━━━━━━━━

class MessageResponse(BaseModel):
    """Generic message response for success/info messages."""
    message: str


# ━━━━━━━━━━━━━━━━━ AUTH SCHEMAS ━━━━━━━━━━━━━━━━━

class UserBase(BaseModel):
    """Fields shared between create and response schemas."""
    name: str
    email: EmailStr
    dob: Optional[date] = None


class UserCreate(UserBase):
    """What the client sends when registering a new account."""
    password: str


class UserLogin(BaseModel):
    """What the client sends when logging in."""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """What the API returns for user data (never includes password)."""
    id: int
    role: str = "user"
    risk_profile: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True   # allows SQLAlchemy model → Pydantic


class TokenResponse(BaseModel):
    """Returned after successful login or token refresh."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    """Client sends the refresh token to get a new access token."""
    refresh_token: str


# ━━━━━━━━━━━━━━━━━ PROFILE SCHEMAS ━━━━━━━━━━━━━━━━━

class UserUpdate(BaseModel):
    """
    Partial update for user profile fields.
    All fields are optional – only provided fields will be updated.
    """
    name: Optional[str] = None
    dob: Optional[date] = None


class RiskProfileUpdate(BaseModel):
    """
    Update the user's risk profile / preferences.
    The risk_profile is a flexible JSON object that can store
    any key-value pairs relevant to insurance recommendations.
    Example:
        {
            "age_group": "25-35",
            "smoker": false,
            "income_bracket": "5-10L",
            "has_dependents": true,
            "preferred_types": ["health", "life"]
        }
    """
    risk_profile: Dict[str, Any]


class PasswordChange(BaseModel):
    """Client sends old + new password to change their password."""
    old_password: str
    new_password: str


# ━━━━━━━━━━━━━━━━━ MESSAGE SCHEMA ━━━━━━━━━━━━━━━━━

class MessageResponse(BaseModel):
    """Generic message response (e.g. 'Password changed successfully')."""
    message: str


# ━━━━━━━━━━━━━━━━━ POLICY SCHEMAS ━━━━━━━━━━━━━━━━━

class ProviderResponse(BaseModel):
    """Insurance provider info."""
    id: int
    name: str
    country: str

    class Config:
        from_attributes = True


class PolicyResponse(BaseModel):
    """Full policy details for catalog display."""
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


# ━━━━━━━━━━━━━━━━━ USER POLICY SCHEMAS ━━━━━━━━━━━━━━━━━

class UserPolicyCreate(BaseModel):
    """What the client sends to enroll in a policy."""
    policy_id: int


class UserPolicyResponse(BaseModel):
    """Full details of a user's enrolled policy."""
    id: int
    policy_id: int
    policy_number: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    premium: Optional[float] = None
    status: str
    auto_renew: bool
    policy: Optional[PolicyResponse] = None

    class Config:
        from_attributes = True


# ━━━━━━━━━━━━━━━━━ COMPARE SCHEMAS ━━━━━━━━━━━━━━━━━

class CompareRequest(BaseModel):
    """Client sends 2–3 policy IDs to compare side-by-side."""
    policy_ids: List[int]


# ━━━━━━━━━━━━━━━━━ QUOTE SCHEMAS ━━━━━━━━━━━━━━━━━

class QuoteRequest(BaseModel):
    """Parameters for premium calculation."""
    policy_id: int
    age: int
    coverage_amount: Optional[float] = None
    term_months: Optional[int] = None


class QuoteResponse(BaseModel):
    """Calculated premium quote with breakdown."""
    policy_id: int
    policy_title: str
    base_premium: float
    age_adjustment_pct: float
    adjusted_premium: float
    term_months: int
    total_cost: float
    annual_cost: float
    breakdown: Dict[str, Any]


# ━━━━━━━━━━━━━━━━━ RECOMMENDATION SCHEMAS ━━━━━━━━━━━━━━━━━

class RecommendationResponse(BaseModel):
    """A scored policy recommendation with reasoning."""
    id: int
    user_id: int
    policy_id: int
    score: float
    reason: str
    policy: Optional[PolicyResponse] = None

    class Config:
        from_attributes = True


# ━━━━━━━━━━━━━━━━━ FRAUD FLAG SCHEMAS ━━━━━━━━━━━━━━━━━

class FraudFlagResponse(BaseModel):
    """A fraud flag raised by the fraud detection engine."""
    id: int
    claim_id: int
    rule_code: str
    severity: str
    details: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ━━━━━━━━━━━━━━━━━ CLAIM SCHEMAS ━━━━━━━━━━━━━━━━━

class ClaimDocumentResponse(BaseModel):
    """Uploaded supporting document for a claim."""
    id: int
    claim_id: int
    file_url: str
    doc_type: Optional[str] = None
    uploaded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ClaimCreate(BaseModel):
    """What the client sends when filing a new claim."""
    user_policy_id: int
    claim_type: str
    incident_date: date
    amount_claimed: float


class ClaimUpdate(BaseModel):
    """Partial update for an existing claim (only draft/submitted)."""
    claim_type: Optional[str] = None
    incident_date: Optional[date] = None
    amount_claimed: Optional[float] = None


class ClaimStatusUpdate(BaseModel):
    """Admin: update claim status (under_review, approved, rejected, paid)."""
    status: str


class ClaimResponse(BaseModel):
    """Full details of a filed claim."""
    id: int
    user_policy_id: int
    claim_number: Optional[str] = None
    claim_type: Optional[str] = None
    incident_date: Optional[date] = None
    amount_claimed: Optional[float] = None
    status: str
    created_at: Optional[datetime] = None
    documents: List[ClaimDocumentResponse] = []
    fraud_flags: List[FraudFlagResponse] = []
    user_policy: Optional[UserPolicyResponse] = None

    class Config:
        from_attributes = True


# ━━━━━━━━━━━━━━━━━ ADMIN ACTION SCHEMAS ━━━━━━━━━━━━━━━━━

class ClaimRejectBody(BaseModel):
    """Admin rejects a claim — reason is mandatory."""
    reason: str

class ClaimRequestInfoBody(BaseModel):
    """Admin requests more info from the user."""
    message: str


# ━━━━━━━━━━━━━━━━━ POLICY ADD-ON SCHEMAS ━━━━━━━━━━━━━━━━━

class PolicyAddonResponse(BaseModel):
    id: int
    policy_id: int
    name: str
    description: Optional[str] = None
    extra_premium: float
    is_active: bool

    class Config:
        from_attributes = True

class UserPolicyAddonCreate(BaseModel):
    addon_id: int

class UserPolicyAddonResponse(BaseModel):
    id: int
    addon_id: int
    addon: Optional[PolicyAddonResponse] = None
    added_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ━━━━━━━━━━━━━━━━━ NETWORK PROVIDER SCHEMAS ━━━━━━━━━━━━━━━━━

class NetworkProviderResponse(BaseModel):
    id: int
    name: str
    provider_type: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        from_attributes = True


# ━━━━━━━━━━━━━━━━━ VEHICLE LOOKUP SCHEMAS ━━━━━━━━━━━━━━━━━

class VehicleInfo(BaseModel):
    reg_number: str
    make: str
    model: str
    year: int
    fuel_type: str
    rto_code: str
    rto_city: str
    vehicle_class: str


# ━━━━━━━━━━━━━━━━━ ENDORSEMENT SCHEMAS ━━━━━━━━━━━━━━━━━

class EndorsementCreate(BaseModel):
    request_type: str   # address_change | nominee_change | vehicle_change | other
    details: str

class EndorsementResponse(BaseModel):
    id: int
    user_policy_id: int
    request_type: str
    details: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ━━━━━━━━━━━━━━━━━ POLICY PDF / RENEWAL SCHEMAS ━━━━━━━━━━━━━━━━━

class PolicyPDFResponse(BaseModel):
    pdf_url: str
    message: str
