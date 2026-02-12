from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    occupation: Optional[str] = None
    annual_income: Optional[float] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    dob: Optional[str] = None

class UserUpdate(UserBase):
    password: Optional[str] = None
    risk_profile: Optional[dict] = None

class UserUpdatePassword(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class UserInDBBase(UserBase):
    id: int
    is_active: bool = True

    class Config:
        from_attributes = True

class User(UserInDBBase):
    risk_profile: Optional[dict] = None
    dob: Optional[date] = None
    created_at: Optional[datetime] = None
    is_admin: bool = False

    class Config:
        from_attributes = True

class UserInDB(UserInDBBase):
    hashed_password: str
