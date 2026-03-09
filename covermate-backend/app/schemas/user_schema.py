from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date

    
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    dob: Optional[date]
    gender: Optional[str]
    occupation: Optional[str]
    annual_income: Optional[float]
    phone: Optional[str]
    risk_profile: Optional[str]



class UserLogin(BaseModel):
    email: EmailStr
    password: str
