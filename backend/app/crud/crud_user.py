
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

def get_by_email(db: Session, email: str) -> User:
    return db.query(User).filter(User.email == email).first()

def create(db: Session, obj_in: UserCreate) -> User:
    risk_profile_data = {
        "occupation": obj_in.occupation,
        "annual_income": obj_in.annual_income,
        "gender": obj_in.gender,
        "marital_status": obj_in.marital_status,
        "phone_number": obj_in.phone_number,
        "address": obj_in.address
    }
    # Remove None values from risk_profile to keep it clean
    risk_profile_data = {k: v for k, v in risk_profile_data.items() if v is not None}

    db_obj = User(
        email=obj_in.email,
        password=get_password_hash(obj_in.password),
        name=obj_in.name,
        dob=obj_in.dob,
        risk_profile=risk_profile_data
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
