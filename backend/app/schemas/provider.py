
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class ProviderBase(BaseModel):
    name: str
    country: Optional[str] = None

class ProviderCreate(ProviderBase):
    pass

class ProviderUpdate(ProviderBase):
    pass

class Provider(ProviderBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
