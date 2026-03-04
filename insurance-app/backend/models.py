from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

# User Models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None

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