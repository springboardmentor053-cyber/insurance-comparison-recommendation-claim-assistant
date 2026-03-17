from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime
from app.database import Base

class ClaimStatusHistory(Base):
    __tablename__ = "claim_status_history"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"))
    status = Column(String, nullable=False)      
    changed_by = Column(String, default="system") # "admin" or "system"
    changed_at = Column(DateTime, default=datetime.utcnow)