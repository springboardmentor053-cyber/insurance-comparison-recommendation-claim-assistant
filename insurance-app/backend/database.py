from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    preferences = relationship("UserPreference", back_populates="user", uselist=False)

class Provider(Base):
    __tablename__ = "providers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    rating = Column(Float, default=0.0)
    
    policies = relationship("Policy", back_populates="provider")

class Policy(Base):
    __tablename__ = "policies"
    
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"))
    name = Column(String, index=True)
    type = Column(String)  # health, auto, life, home
    coverage_amount = Column(Float)
    premium_monthly = Column(Float)
    deductible = Column(Float)
    description = Column(Text, nullable=True)
    
    provider = relationship("Provider", back_populates="policies")

class UserPreference(Base):
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    age = Column(Integer)
    annual_income = Column(Float)
    family_size = Column(Integer, default=1)
    health_status = Column(String)  # excellent, good, fair, poor
    preferred_coverage = Column(Float)
    max_monthly_budget = Column(Float)
    risk_tolerance = Column(String, default="medium")  # low, medium, high
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="preferences")

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    policy_id = Column(Integer, ForeignKey("policies.id"))
    score = Column(Float)  # 0-100 match score
    reason = Column(Text)  # Why this policy is recommended
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")
    policy = relationship("Policy")

class Claim(Base):
    __tablename__ = "claims"
    
    id = Column(Integer, primary_key=True, index=True)
    claim_number = Column(String, unique=True, index=True)  # NEW: CLM-2026-0001
    user_id = Column(Integer, ForeignKey("users.id"))
    policy_id = Column(Integer, ForeignKey("policies.id"))
    claim_type = Column(String)
    claim_amount = Column(Float)
    description = Column(Text)
    status = Column(String, default="draft")  # CHANGED: draft instead of pending
    filed_date = Column(DateTime, default=datetime.utcnow)
    submitted_date = Column(DateTime, nullable=True)  # NEW: when user submits
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    admin_notes = Column(Text, nullable=True)
    
    user = relationship("User")
    policy = relationship("Policy")

class ClaimStatusHistory(Base):
    __tablename__ = "claim_status_history"
    
    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"))
    old_status = Column(String, nullable=True)
    new_status = Column(String)
    changed_by = Column(Integer, nullable=True)  # user_id who made the change
    changed_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    
    claim = relationship("Claim")

class ClaimDocument(Base):
    __tablename__ = "claim_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"))
    file_name = Column(String)
    file_path = Column(String)  # Path where file is stored
    file_type = Column(String)  # medical_bill, accident_photo, police_report, etc.
    file_size = Column(Integer)  # Size in bytes
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    claim = relationship("Claim")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create all tables
def init_db():
    Base.metadata.create_all(bind=engine)