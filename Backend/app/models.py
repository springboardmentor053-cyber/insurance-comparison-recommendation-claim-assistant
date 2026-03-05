from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    dob = Column(Date)
    risk_profile = Column(JSONB, default={})
    created_at = Column(DateTime, server_default=func.now())

class Provider(Base):
    __tablename__ = "providers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    country = Column(String) # Required per your error log
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
    provider = relationship("Provider", back_populates="policies")