
from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal

# Policy Schemas
class PolicyBase(BaseModel):
    title: str
    policy_type: str
    premium: float
    term_months: int
    deductible: float
    coverage: Optional[dict] = None
    description: Optional[str] = None
    tnc_url: Optional[str] = None
    provider_id: int

class PolicyCreate(PolicyBase):
    pass

class PolicyUpdate(PolicyBase):
    pass

from .provider import Provider

class Policy(PolicyBase):
    id: int
    created_at: datetime
    provider: Optional[Provider] = None

    class Config:
        from_attributes = True

class PolicyList(BaseModel):
    items: List[Policy]
