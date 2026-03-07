from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional, Any, Dict, List

# User Schemas
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

# Policy Schemas
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

# Recommendation Schemas
class UserPreferences(BaseModel):
    """Schema for capturing user preferences for recommendations"""
    income: Optional[float] = None
    family_size: Optional[int] = 1
    smoker: Optional[bool] = False
    existing_conditions: List[str] = []
    risk_appetite: str = "medium"  # low, medium, high
    coverage_priority: str = "balanced"  # low_cost, balanced, maximum_coverage
    preferred_policy_types: List[str] = []  # ['auto', 'health', 'life', 'home', 'travel']
    max_budget: Optional[float] = None
    employment_type: Optional[str] = None  # salaried, self_employed, business
    travel_frequency: Optional[str] = None  # rarely, occasionally, frequently
    vehicle_owned: Optional[bool] = False
    home_owned: Optional[bool] = False

class UserUpdate(BaseModel):
    """Update user profile including risk_profile"""
    name: Optional[str] = None
    dob: Optional[date] = None
    risk_profile: Optional[Dict[str, Any]] = None

class RecommendationResponse(BaseModel):
    """Recommendation output schema"""
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
    """Request to generate recommendations"""
    refresh: bool = False
    limit: int = 10

class ScoringBreakdown(BaseModel):
    """Detailed scoring breakdown for explainability"""
    coverage_score: float
    premium_score: float
    deductible_score: float
    type_match_score: float
    term_score: float
    total_score: float
    reason: str