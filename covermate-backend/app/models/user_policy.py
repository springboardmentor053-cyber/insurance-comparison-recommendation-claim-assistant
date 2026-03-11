from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from datetime import datetime
from app.database import Base


class UserPolicy(Base):
    __tablename__ = "user_policies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    policy_id = Column(Integer, ForeignKey("policies.id"))
    purchase_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="active")