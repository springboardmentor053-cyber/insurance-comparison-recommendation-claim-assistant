
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base


class UserPolicy(Base):
    __tablename__ = "user_policies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    policy_id = Column(Integer, ForeignKey("policies.id"), nullable=False)
    purchase_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    premium_paid = Column(Numeric(10, 2), nullable=False)
    status = Column(String, default="active")   # active / expired / cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", backref="user_policies")
    policy = relationship("Policy", backref="user_policies")
    claims = relationship("Claim", back_populates="user_policy")
