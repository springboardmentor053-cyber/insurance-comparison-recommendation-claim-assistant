
from sqlalchemy import Column, Integer, String, Numeric, Enum, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base_class import Base

class PolicyType(str, enum.Enum):
    auto = "auto"
    health = "health"
    life = "life"
    home = "home"
    travel = "travel"

class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"))
    policy_type = Column(Enum(PolicyType), nullable=False)
    title = Column(String, index=True, nullable=False)
    coverage = Column(JSON)
    premium = Column(Numeric, nullable=False)
    term_months = Column(Integer)
    deductible = Column(Numeric)
    tnc_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    provider = relationship("Provider")
