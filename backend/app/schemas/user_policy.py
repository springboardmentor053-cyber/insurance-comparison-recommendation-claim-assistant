
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel


# ── UserPolicy Schemas ─────────────────────────────────────────────────────────

class BuyPolicyRequest(BaseModel):
    policy_id: int


class UserPolicyBase(BaseModel):
    policy_id: int
    status: Optional[str] = "active"


class UserPolicyOut(UserPolicyBase):
    id: int
    user_id: int
    purchase_date: date
    expiry_date: date
    premium_paid: Decimal

    class Config:
        from_attributes = True


class UserPolicyWithPolicy(UserPolicyOut):
    policy: Optional[dict] = None

    class Config:
        from_attributes = True
