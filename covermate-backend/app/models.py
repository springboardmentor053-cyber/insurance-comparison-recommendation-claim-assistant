"""
Database Models – SQLAlchemy ORM definitions for all tables.

This file defines every table in the CoverMate database exactly as
described in the project PDF schema.  Each class maps to one PostgreSQL
table.  Relationships let you navigate between related objects in Python
(e.g.  user.policies  →  list of UserPolicy rows).
"""

from sqlalchemy import (
    Column, Integer, String, Date, DateTime, Numeric,
    Boolean, Text, ForeignKey, Enum as SAEnum
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


# ━━━━━━━━━━━━━━━━━ ENUMS ━━━━━━━━━━━━━━━━━
# SQLAlchemy Enum types that mirror the PDF specification.

PolicyTypeEnum = SAEnum(
    'auto', 'health', 'life', 'home', 'travel',
    name='policy_type_enum', create_type=True
)

UserPolicyStatusEnum = SAEnum(
    'active', 'expired', 'cancelled',
    name='user_policy_status_enum', create_type=True
)

ClaimStatusEnum = SAEnum(
    'draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid',
    name='claim_status_enum', create_type=True
)

FraudSeverityEnum = SAEnum(
    'low', 'medium', 'high',
    name='fraud_severity_enum', create_type=True
)


# ━━━━━━━━━━━━━━━━━ USERS ━━━━━━━━━━━━━━━━━
class User(Base):
    """
    Represents a registered user of the platform.
    - 'role' is either 'user' (default) or 'admin'.
    - 'risk_profile' stores a flexible JSON object with the user's
      preferences / risk questionnaire answers.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="user")          # "user" | "admin"
    dob = Column(Date, nullable=True)
    risk_profile = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user_policies = relationship("UserPolicy", back_populates="user")
    recommendations = relationship("Recommendation", back_populates="user")
    admin_logs = relationship("AdminLog", back_populates="admin")


# ━━━━━━━━━━━━━━━━━ PROVIDERS ━━━━━━━━━━━━━━━━━
class Provider(Base):
    """An insurance provider / company (e.g. LIC, HDFC Ergo)."""
    __tablename__ = "providers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    country = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    policies = relationship("Policy", back_populates="provider")


# ━━━━━━━━━━━━━━━━━ POLICIES ━━━━━━━━━━━━━━━━━
class Policy(Base):
    """
    A specific insurance policy offered by a Provider.
    - coverage: JSONB dict describing what the policy covers.
    - premium: monthly / annual premium amount.
    - deductible: amount the user pays before coverage kicks in.
    """
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=False)
    policy_type = Column(PolicyTypeEnum, nullable=False)
    title = Column(String, nullable=False)
    coverage = Column(JSONB, nullable=True)
    premium = Column(Numeric, nullable=False)
    term_months = Column(Integer, nullable=True)
    deductible = Column(Numeric, nullable=True)
    tnc_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    provider = relationship("Provider", back_populates="policies")
    user_policies = relationship("UserPolicy", back_populates="policy")
    recommendations = relationship("Recommendation", back_populates="policy")


# ━━━━━━━━━━━━━━━━━ USER POLICIES ━━━━━━━━━━━━━━━━━
class UserPolicy(Base):
    """
    A policy that a user has purchased / enrolled in.
    Tracks start/end dates, status, and auto-renewal preference.
    """
    __tablename__ = "user_policies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    policy_id = Column(Integer, ForeignKey("policies.id"), nullable=False)
    policy_number = Column(String, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    premium = Column(Numeric, nullable=True)
    status = Column(UserPolicyStatusEnum, default='active')
    auto_renew = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="user_policies")
    policy = relationship("Policy", back_populates="user_policies")
    claims = relationship("Claim", back_populates="user_policy")


# ━━━━━━━━━━━━━━━━━ CLAIMS ━━━━━━━━━━━━━━━━━
class Claim(Base):
    """
    An insurance claim filed by the user against one of their policies.
    Status progresses: draft → submitted → under_review → approved/rejected → paid.
    """
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    user_policy_id = Column(Integer, ForeignKey("user_policies.id"), nullable=False)
    claim_number = Column(String, nullable=True)
    claim_type = Column(String, nullable=True)
    incident_date = Column(Date, nullable=True)
    amount_claimed = Column(Numeric, nullable=True)
    risk_score = Column(Integer, default=0)
    status = Column(ClaimStatusEnum, default='draft')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user_policy = relationship("UserPolicy", back_populates="claims")
    documents = relationship(
        "ClaimDocument",
        back_populates="claim",
        cascade="all, delete-orphan"
    )
    fraud_flags = relationship("FraudFlag", back_populates="claim")
    status_history = relationship(
        "ClaimStatusHistory",
        back_populates="claim",
        order_by="ClaimStatusHistory.changed_at",
        cascade="all, delete-orphan"
    )


# ━━━━━━━━━━━━━━━━━ CLAIM STATUS HISTORY ━━━━━━━━━━━━━━━━━
class ClaimStatusHistory(Base):
    """
    Tracks every status change for a claim — the timeline feature.
    A new row is inserted each time an admin updates the claim status.
    This allows users to see the full history:
      e.g. submitted → under_review → approved → paid
    """
    __tablename__ = "claim_status_history"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False)
    status = Column(String, nullable=False)           # the new status at this point
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # admin user id
    changed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    claim = relationship("Claim", back_populates="status_history")
    changed_by_user = relationship("User", foreign_keys=[changed_by])


# ━━━━━━━━━━━━━━━━━ CLAIM DOCUMENTS ━━━━━━━━━━━━━━━━━
class ClaimDocument(Base):
    """A supporting document uploaded for a claim (e.g. receipt, FIR)."""
    __tablename__ = "claim_documents"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False)
    file_url = Column(String, nullable=False)
    doc_type = Column(String, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    claim = relationship("Claim", back_populates="documents")


# ━━━━━━━━━━━━━━━━━ RECOMMENDATIONS ━━━━━━━━━━━━━━━━━
class Recommendation(Base):
    """
    A policy recommendation generated for a user by the recommendation engine.
    Score indicates how well the policy matches the user's risk profile.
    """
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    policy_id = Column(Integer, ForeignKey("policies.id"), nullable=False)
    score = Column(Numeric(10,2), nullable=True)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="recommendations")
    policy = relationship("Policy", back_populates="recommendations")


# ━━━━━━━━━━━━━━━━━ FRAUD FLAGS ━━━━━━━━━━━━━━━━━
class FraudFlag(Base):
    """
    A flag raised by the fraud detection engine on a specific claim.
    rule_code identifies which fraud rule was triggered.
    """
    __tablename__ = "fraud_flags"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False)
    rule_code = Column(String, nullable=False)
    severity = Column(FraudSeverityEnum, default='low')
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    claim = relationship("Claim", back_populates="fraud_flags")


# ━━━━━━━━━━━━━━━━━ ADMIN LOGS ━━━━━━━━━━━━━━━━━
class AdminLog(Base):
    """Audit trail of admin actions (e.g. approving a claim, flagging fraud)."""
    __tablename__ = "admin_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(Text, nullable=False)
    target_type = Column(String, nullable=True)
    target_id = Column(Integer, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    admin = relationship("User", back_populates="admin_logs")
