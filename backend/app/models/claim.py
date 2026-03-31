
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base


class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_number = Column(String, unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_policy_id = Column(Integer, ForeignKey("user_policies.id"), nullable=False)
    claim_type = Column(String, nullable=False)          # health / auto / home / life / travel
    incident_date = Column(Date, nullable=False)
    incident_description = Column(Text, nullable=False)
    amount_claimed = Column(Numeric(10, 2), nullable=False)
    amount_approved = Column(Numeric(10, 2), nullable=True)
    status = Column(String, default="draft")            # draft / submitted / under_review / approved / rejected / paid
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Policy-specific optional fields (stored as string / nullable)
    incident_location = Column(String, nullable=True)
    third_party_involved = Column(String, nullable=True)   # "yes" / "no"
    police_report_number = Column(String, nullable=True)
    hospital_name = Column(String, nullable=True)
    repair_estimate = Column(Numeric(10, 2), nullable=True)
    # Life specific
    beneficiary_name = Column(String, nullable=True)
    beneficiary_relation = Column(String, nullable=True)
    cause = Column(String, nullable=True)
    # Travel specific
    trip_destination = Column(String, nullable=True)

    # Relationships
    user = relationship("User", backref="claims")
    user_policy = relationship("UserPolicy", back_populates="claims")
    documents = relationship("ClaimDocument", back_populates="claim", cascade="all, delete-orphan")
    history = relationship("ClaimStatusHistory", back_populates="claim", order_by="ClaimStatusHistory.changed_at", cascade="all, delete-orphan")
    fraud_flags = relationship("ClaimFraudFlag", back_populates="claim", cascade="all, delete-orphan")


class ClaimStatusHistory(Base):
    __tablename__ = "claim_status_history"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False)
    status = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    claim = relationship("Claim", back_populates="history")


class ClaimDocument(Base):
    __tablename__ = "claim_documents"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False)
    file_url = Column(String, nullable=False)
    doc_type = Column(String, nullable=False)   # accident_photo / repair_invoice / police_report / medical_report / other
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    claim = relationship("Claim", back_populates="documents")


class ClaimFraudFlag(Base):
    __tablename__ = "claim_fraud_flags"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False)
    rule_name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    claim = relationship("Claim", back_populates="fraud_flags")
