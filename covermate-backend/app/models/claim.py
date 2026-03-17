from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime
from datetime import datetime
from app.database import Base

class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_number = Column(String, unique=True)
    user_policy_id = Column(Integer, ForeignKey("user_policies.id"))
    claim_type = Column(String)
    incident_date = Column(Date)
    amount_claimed = Column(Integer)
    status = Column(String, default="draft")
    created_at = Column(DateTime, default=datetime.utcnow)