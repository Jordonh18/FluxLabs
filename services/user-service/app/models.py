from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base

class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class UserSettings(Base):
    __tablename__ = "user_settings"

    user_id = Column(Integer, primary_key=True, index=True)
    auto_extend_labs = Column(Boolean, default=False)
    default_duration = Column(Integer, default=60)  # minutes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
