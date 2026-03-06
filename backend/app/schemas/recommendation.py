from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from decimal import Decimal
from .policy import Policy

class RecommendationBase(BaseModel):
    policy_id: int
    score: Decimal
    reason: Optional[str] = None

class RecommendationCreate(RecommendationBase):
    user_id: int

class RecommendationUpdate(RecommendationBase):
    pass

class Recommendation(RecommendationBase):
    id: int
    user_id: int
    created_at: datetime
    policy: Optional[Policy] = None

    class Config:
        from_attributes = True
