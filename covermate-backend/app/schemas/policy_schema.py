from pydantic import BaseModel
from typing import Dict

class PolicyBase(BaseModel):
    title: str
    policy_type: str
    premium: float
    term_months: int
    deductible: float
    provider_id: int
    coverage: Dict[str, str]
    tnc_url: str


class PolicyCreate(PolicyBase):
    pass


class PolicyResponse(PolicyBase):
    id: int

    class Config:
        from_attributes = True

