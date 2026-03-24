from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, ForeignKey, Float, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base
from sqlalchemy.sql import func

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    dob = Column(Date)
    risk_profile = Column(JSONB, default={})
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    user_policies = relationship("UserPolicy", back_populates="user")

class Provider(Base):
    __tablename__ = "providers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    country = Column(String)
    contact_email = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    policies = relationship("Policy", back_populates="provider")

class Policy(Base):
    __tablename__ = "policies"
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"))
    policy_type = Column(String)
    title = Column(String, nullable=False)
    description = Column(String)
    premium = Column(Numeric)
    deductible = Column(Numeric)
    term_months = Column(Integer)
    coverage = Column(JSONB)
    tnc_url = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    provider = relationship("Provider", back_populates="policies")
    recommendations = relationship("Recommendation", back_populates="policy")
    user_policies = relationship("UserPolicy", back_populates="policy")

class UserPolicy(Base):
    __tablename__ = "user_policies"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    policy_id = Column(Integer, ForeignKey("policies.id"))
    policy_number = Column(String, unique=True)
    start_date = Column(Date)
    end_date = Column(Date)
    premium = Column(Numeric)
    status = Column(String)  # active, expired, cancelled
    auto_renew = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="user_policies")
    policy = relationship("Policy", back_populates="user_policies")
    claims = relationship("Claim", back_populates="user_policy", cascade="all, delete-orphan")

class Claim(Base):
    __tablename__ = "claims"
    id = Column(Integer, primary_key=True, index=True)
    user_policy_id = Column(Integer, ForeignKey("user_policies.id"))
    claim_number = Column(String, unique=True, index=True)
    claim_type = Column(String)  # e.g., "accident", "theft", "damage"
    incident_date = Column(Date)
    description = Column(Text)  # Added description field
    amount_claimed = Column(Numeric)
    status = Column(String)  # draft, submitted, under_review, approved, rejected, paid
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())  # Optional: track updates
    
    # Relationships
    user_policy = relationship("UserPolicy", back_populates="claims")
    documents = relationship("ClaimDocument", back_populates="claim", cascade="all, delete-orphan")
    fraud_flags = relationship("FraudFlag", back_populates="claim")

class ClaimDocument(Base):
    __tablename__ = "claim_documents"
    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"))
    file_url = Column(String)
    doc_type = Column(String)  # e.g., "accident_photo", "police_report", "estimate"
    uploaded_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    claim = relationship("Claim", back_populates="documents")

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    policy_id = Column(Integer, ForeignKey("policies.id"))
    score = Column(Float)
    reason = Column(Text)
    scoring_breakdown = Column(JSONB)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="recommendations")
    policy = relationship("Policy", back_populates="recommendations")

class FraudFlag(Base):
    __tablename__ = "fraud_flags"
    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"))
    rule_code = Column(String)
    severity = Column(String)  # low, medium, high
    details = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    claim = relationship("Claim", back_populates="fraud_flags")

class AdminLog(Base):
    __tablename__ = "admin_logs"
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"))
    action = Column(Text)
    target_type = Column(String)
    target_id = Column(Integer)
    timestamp = Column(DateTime, server_default=func.now())