from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


class RiskProfileUpdate(BaseModel):
    """All user-selectable risk profile fields for personalized recommendations."""
    # Already existing fields
    occupation: Optional[str] = None
    annual_income: Optional[float] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None

    # Group 1: Health & Lifestyle
    smoker: Optional[bool] = None
    alcohol_consumption: Optional[str] = None        # never / occasionally / regularly
    exercise_frequency: Optional[str] = None         # rarely / sometimes / regularly
    bmi_category: Optional[str] = None               # underweight / normal / overweight / obese
    existing_conditions: Optional[List[str]] = None  # ["diabetes", "hypertension", ...]

    # Group 2: Family & Social
    family_size: Optional[int] = None
    num_dependents: Optional[int] = None
    has_vehicle: Optional[bool] = None

    # Group 3: Financial & Employment
    employment_type: Optional[str] = None            # salaried / self_employed / business_owner / freelancer / retired / student

    # Group 4: Insurance Preferences
    risk_appetite: Optional[str] = None              # low / medium / high
    coverage_priority: Optional[str] = None          # cost_saving / balanced / comprehensive


class UserBasicUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    dob: Optional[date] = None


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
    dob: Optional[date] = None


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
