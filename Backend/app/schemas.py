from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional, Any, Dict, List

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    dob: date
    risk_profile: Optional[Dict[str, Any]] = {}

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PolicyResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    premium: float      
    policy_type: str    
    deductible: float   
    term_months: int    
    coverage: Optional[Dict[str, Any]] 
    tnc_url: Optional[str]
    provider_name: Optional[str] = "Standard Provider"
    created_at: Optional[datetime]

    class Config:
        from_attributes = True