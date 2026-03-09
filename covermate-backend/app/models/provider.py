from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base

class Provider(Base):
    __tablename__ = "providers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    country = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
