from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base

class Container(Base):
    __tablename__ = "containers"

    id = Column(Integer, primary_key=True, index=True)
    docker_id = Column(String, unique=True, index=True, nullable=False)
    image = Column(String, nullable=False)
    status = Column(String, nullable=False)  # running, stopped, error
    ssh_port = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class AvailableImage(Base):
    __tablename__ = "available_images"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    tag = Column(String, nullable=False, default="latest")
    description = Column(String, nullable=True)
    ssh_enabled = Column(Boolean, default=True)
