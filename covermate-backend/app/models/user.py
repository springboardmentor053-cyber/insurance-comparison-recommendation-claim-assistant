from sqlalchemy import Column, Integer, String, Date, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    dob = Column(Date)
    gender = Column(String)
    occupation = Column(String)
    annual_income = Column(Integer)
    phone = Column(String)
    risk_profile = Column(String)  
    created_at = Column(DateTime, default=datetime.utcnow)
    

