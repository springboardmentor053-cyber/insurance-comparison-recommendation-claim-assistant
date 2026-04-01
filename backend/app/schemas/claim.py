
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field


# ── Claim Document Schemas ─────────────────────────────────────────────────────

class ClaimDocumentOut(BaseModel):
    id: int
    claim_id: int
    file_url: str
    doc_type: str
    uploaded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserMinimal(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class PolicyMinimal(BaseModel):
    id: int
    title: str
    policy_type: str

    class Config:
        from_attributes = True


class ClaimStatusHistoryOut(BaseModel):
    id: int
    claim_id: int
    status: str
    notes: Optional[str] = None
    changed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FraudFlagOut(BaseModel):
    id: int
    claim_id: int
    rule_code: str
    severity: str
    details: str
    is_reviewed: str = "pending"
    reviewed_by: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Claim Schemas ──────────────────────────────────────────────────────────────

class ClaimCreate(BaseModel):
    user_policy_id: int
    claim_type: str
    incident_date: date
    incident_description: str
    amount_claimed: Decimal
    # Optional fields
    incident_location: Optional[str] = None
    third_party_involved: Optional[str] = None
    police_report_number: Optional[str] = None
    hospital_name: Optional[str] = None
    repair_estimate: Optional[Decimal] = None
    beneficiary_name: Optional[str] = None
    beneficiary_relation: Optional[str] = None
    cause: Optional[str] = None
    trip_destination: Optional[str] = None


class ClaimUpdate(BaseModel):
    claim_type: Optional[str] = None
    incident_date: Optional[date] = None
    incident_description: Optional[str] = None
    amount_claimed: Optional[Decimal] = None
    incident_location: Optional[str] = None
    third_party_involved: Optional[str] = None
    police_report_number: Optional[str] = None
    hospital_name: Optional[str] = None
    repair_estimate: Optional[Decimal] = None
    beneficiary_name: Optional[str] = None
    beneficiary_relation: Optional[str] = None
    cause: Optional[str] = None
    trip_destination: Optional[str] = None


class ClaimOut(BaseModel):
    id: int
    claim_number: str
    user_id: int
    user_policy_id: int
    claim_type: str
    incident_date: date
    incident_description: str
    amount_claimed: Decimal
    amount_approved: Optional[Decimal] = None
    status: str
    admin_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    history: List[ClaimStatusHistoryOut] = []
    fraud_flags: List[FraudFlagOut] = []
    
    # Extra information for Admin Detail View
    user: Optional[UserMinimal] = None
    policy: Optional[PolicyMinimal] = None

    # Optional extra fields
    incident_location: Optional[str] = None
    third_party_involved: Optional[str] = None
    police_report_number: Optional[str] = None
    hospital_name: Optional[str] = None
    repair_estimate: Optional[Decimal] = None
    beneficiary_name: Optional[str] = None
    beneficiary_relation: Optional[str] = None
    cause: Optional[str] = None
    trip_destination: Optional[str] = None

    class Config:
        from_attributes = True


class ClaimWithDocs(ClaimOut):
    documents: List[ClaimDocumentOut] = []

    class Config:
        from_attributes = True


# ── Admin Schemas ──────────────────────────────────────────────────────────────

class AdminClaimAction(BaseModel):
    amount_approved: Optional[Decimal] = None
    admin_notes: Optional[str] = None
