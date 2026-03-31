from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, RiskProfileUpdate, UserBasicUpdate
from app.core.security import get_password_hash


def get_by_email(db: Session, email: str) -> User:
    return db.query(User).filter(User.email == email).first()


def get(db: Session, id: int) -> User:
    return db.query(User).filter(User.id == id).first()


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


def update_risk_profile(db: Session, user: User, profile_in: RiskProfileUpdate) -> User:
    """
    Merge new risk profile fields into the existing risk_profile JSON.
    Only updates fields that are explicitly provided (not None).
    """
    existing = user.risk_profile or {}
    updates = profile_in.model_dump(exclude_none=True)
    merged = {**existing, **updates}
    user.risk_profile = merged
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_basic_info(db: Session, user: User, profile_in: UserBasicUpdate) -> User:
    if profile_in.name is not None:
        user.name = profile_in.name
    if profile_in.email is not None:
        user.email = profile_in.email
    if profile_in.dob is not None:
        user.dob = profile_in.dob
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
