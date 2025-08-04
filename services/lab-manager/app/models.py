from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base

class Lab(Base):
    __tablename__ = "labs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    container_id = Column(Integer, nullable=True)
    name = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    persistent = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, nullable=False, default="creating")  # creating, running, stopped, expired

class LabTemplate(Base):
    __tablename__ = "lab_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    image = Column(String, nullable=False)
    default_duration_hours = Column(Integer, default=1)

class ScheduledTask(Base):
    __tablename__ = "scheduled_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_type = Column(String, nullable=False)  # expire_lab, cleanup_container
    target_id = Column(Integer, nullable=False)  # lab_id or container_id
    execute_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="pending")  # pending, completed, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
