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
from datetime import date
from typing import Optional, Dict, Any


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
        orm_mode = True
        from pydantic import BaseModel


class PremiumCalculationRequest(BaseModel):
    policy_id: int
    age: int
    coverage_amount: float
    term_months: int
    risk_factor: float = 1.0
