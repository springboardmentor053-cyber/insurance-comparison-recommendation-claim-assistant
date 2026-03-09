from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Enum
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from app.database import Base
import enum


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
    policy_type = Column(Enum(PolicyType))
    title = Column(String, nullable=False)
    coverage = Column(JSONB)
    premium = Column(Numeric)
    term_months = Column(Integer)
    deductible = Column(Numeric)
    tnc_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
