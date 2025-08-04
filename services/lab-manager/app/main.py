from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import get_database, engine, Base
from models import Lab, LabTemplate
from lab_service import LabService
from scheduler import scheduler
import uvicorn
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Create tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Failed to create database tables: {e}")
    raise

app = FastAPI(title="Lab Manager", version="1.0.0")
lab_service = LabService()

logger.info("Lab Manager starting up...")

class LabCreate(BaseModel):
    name: str
    template_id: int
    duration_hours: Optional[int] = None

class LabResponse(BaseModel):
    id: int
    user_id: int
    container_id: Optional[int]
    name: str
    expires_at: datetime
    persistent: bool
    status: str
    
    class Config:
        from_attributes = True

class TemplateResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    image: str
    default_duration_hours: int

@app.post("/labs", response_model=LabResponse)
async def create_lab(lab_data: LabCreate, user_id: int = Query(...), db: Session = Depends(get_database)):
    try:
        logger.info(f"Creating lab for user {user_id}: {lab_data.name} with template {lab_data.template_id}")
        lab = await lab_service.create_lab(
            db=db,
            user_id=user_id,
            name=lab_data.name,
            template_id=lab_data.template_id,
            duration_hours=lab_data.duration_hours
        )
        logger.info(f"Lab created successfully: {lab.id}")
        return lab
    except Exception as e:
        logger.error(f"Failed to create lab: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/labs/user/{user_id}", response_model=list[LabResponse])
def get_user_labs(user_id: int, db: Session = Depends(get_database)):
    labs = lab_service.get_user_labs(db, user_id)
    return labs

@app.get("/labs/{lab_id}", response_model=LabResponse)
def get_lab(lab_id: int, db: Session = Depends(get_database)):
    lab = lab_service.get_lab(db, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    return lab

@app.post("/labs/{lab_id}/extend")
async def extend_lab(lab_id: int, additional_hours: int, db: Session = Depends(get_database)):
    success = await lab_service.extend_lab(db, lab_id, additional_hours)
    if success:
        return {"message": "Lab extended"}
    else:
        raise HTTPException(status_code=400, detail="Cannot extend lab")

@app.delete("/labs/{lab_id}")
async def terminate_lab(lab_id: int, db: Session = Depends(get_database)):
    success = await lab_service.expire_lab(db, lab_id)
    if success:
        return {"message": "Lab terminated"}
    else:
        raise HTTPException(status_code=404, detail="Lab not found")

@app.get("/templates", response_model=list[TemplateResponse])
def get_templates(db: Session = Depends(get_database)):
    return lab_service.get_templates(db)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Initialize default templates
@app.on_event("startup")
async def startup_event():
    # Start the scheduler
    scheduler.start()
    
    # Add default templates if none exist, or update if we have the old basic set
    db = next(get_database())
    
    # Check if we have the old basic template set (3 templates)
    template_count = db.query(LabTemplate).count()
    has_old_templates = (template_count == 3 and 
                        db.query(LabTemplate).filter(LabTemplate.name.in_(["Ubuntu Lab", "Python Lab", "Node.js Lab"])).count() == 3)
    
    if template_count == 0 or has_old_templates:
        # Clear old templates if they exist
        if has_old_templates:
            db.query(LabTemplate).delete()
            db.commit()
            
        default_templates = [
            # Popular Linux Distributions
            LabTemplate(name="Ubuntu 22.04", description="Ubuntu 22.04 LTS (Jammy Jellyfish)", image="ubuntu:22.04", default_duration_hours=2),
            LabTemplate(name="Ubuntu 20.04", description="Ubuntu 20.04 LTS (Focal Fossa)", image="ubuntu:20.04", default_duration_hours=2),
            LabTemplate(name="Ubuntu Latest", description="Latest Ubuntu release", image="ubuntu:latest", default_duration_hours=2),
            LabTemplate(name="Debian 12", description="Debian 12 (Bookworm)", image="debian:12", default_duration_hours=2),
            LabTemplate(name="Debian 11", description="Debian 11 (Bullseye)", image="debian:11", default_duration_hours=2),
            LabTemplate(name="CentOS 7", description="CentOS 7 Linux", image="centos:7", default_duration_hours=2),
            LabTemplate(name="AlmaLinux 9", description="AlmaLinux 9 (CentOS successor)", image="almalinux:9", default_duration_hours=2),
            LabTemplate(name="AlmaLinux 8", description="AlmaLinux 8 (CentOS successor)", image="almalinux:8", default_duration_hours=2),
            LabTemplate(name="Rocky Linux 9", description="Rocky Linux 9 (CentOS alternative)", image="rockylinux:9", default_duration_hours=2),
            LabTemplate(name="Rocky Linux 8", description="Rocky Linux 8 (CentOS alternative)", image="rockylinux:8", default_duration_hours=2),
            LabTemplate(name="Fedora 39", description="Fedora 39 Linux", image="fedora:39", default_duration_hours=2),
            LabTemplate(name="Fedora 38", description="Fedora 38 Linux", image="fedora:38", default_duration_hours=2),
            LabTemplate(name="Alpine Linux", description="Lightweight Alpine Linux", image="alpine:latest", default_duration_hours=1),
            LabTemplate(name="Arch Linux", description="Arch Linux rolling release", image="archlinux:latest", default_duration_hours=2),
            LabTemplate(name="openSUSE Leap", description="openSUSE Leap stable release", image="opensuse/leap:latest", default_duration_hours=2),
            LabTemplate(name="openSUSE Tumbleweed", description="openSUSE Tumbleweed rolling release", image="opensuse/tumbleweed:latest", default_duration_hours=2),
            LabTemplate(name="Kali Linux", description="Kali Linux for penetration testing", image="kalilinux/kali-rolling:latest", default_duration_hours=3),
            LabTemplate(name="Amazon Linux 2", description="Amazon Linux 2", image="amazonlinux:2", default_duration_hours=2),
            LabTemplate(name="Amazon Linux 2023", description="Amazon Linux 2023", image="amazonlinux:2023", default_duration_hours=2),
            LabTemplate(name="Oracle Linux 9", description="Oracle Linux 9", image="oraclelinux:9", default_duration_hours=2),
            LabTemplate(name="Oracle Linux 8", description="Oracle Linux 8", image="oraclelinux:8", default_duration_hours=2),
            
            # Development Environments
            LabTemplate(name="Python 3.12", description="Python 3.12 development environment", image="python:3.12", default_duration_hours=2),
            LabTemplate(name="Python 3.11", description="Python 3.11 development environment", image="python:3.11", default_duration_hours=2),
            LabTemplate(name="Python 3.10", description="Python 3.10 development environment", image="python:3.10", default_duration_hours=2),
            LabTemplate(name="Node.js 20", description="Node.js 20 LTS development environment", image="node:20", default_duration_hours=2),
            LabTemplate(name="Node.js 18", description="Node.js 18 LTS development environment", image="node:18", default_duration_hours=2),
            LabTemplate(name="Java 21", description="OpenJDK 21 development environment", image="openjdk:21", default_duration_hours=2),
            LabTemplate(name="Java 17", description="OpenJDK 17 LTS development environment", image="openjdk:17", default_duration_hours=2),
            LabTemplate(name="Java 11", description="OpenJDK 11 LTS development environment", image="openjdk:11", default_duration_hours=2),
            LabTemplate(name="Go Latest", description="Go programming language latest", image="golang:latest", default_duration_hours=2),
            LabTemplate(name="Rust Latest", description="Rust programming language", image="rust:latest", default_duration_hours=2),
            LabTemplate(name="PHP 8.3", description="PHP 8.3 development environment", image="php:8.3", default_duration_hours=2),
            LabTemplate(name="PHP 8.2", description="PHP 8.2 development environment", image="php:8.2", default_duration_hours=2),
            LabTemplate(name="Ruby 3.3", description="Ruby 3.3 development environment", image="ruby:3.3", default_duration_hours=2),
            LabTemplate(name="Ruby 3.2", description="Ruby 3.2 development environment", image="ruby:3.2", default_duration_hours=2),
            
            # Databases
            LabTemplate(name="MySQL 8.0", description="MySQL 8.0 database server", image="mysql:8.0", default_duration_hours=2),
            LabTemplate(name="PostgreSQL 16", description="PostgreSQL 16 database server", image="postgres:16", default_duration_hours=2),
            LabTemplate(name="PostgreSQL 15", description="PostgreSQL 15 database server", image="postgres:15", default_duration_hours=2),
            LabTemplate(name="MongoDB 7", description="MongoDB 7 NoSQL database", image="mongo:7", default_duration_hours=2),
            LabTemplate(name="Redis 7", description="Redis 7 in-memory database", image="redis:7", default_duration_hours=1),
            
            # Web Servers
            LabTemplate(name="Nginx", description="Nginx web server", image="nginx:latest", default_duration_hours=1),
            LabTemplate(name="Apache", description="Apache HTTP server", image="httpd:latest", default_duration_hours=1),
            
            # Specialized Tools
            LabTemplate(name="Docker in Docker", description="Docker-in-Docker for container development", image="docker:dind", default_duration_hours=3),
            LabTemplate(name="Ansible", description="Ansible automation platform", image="ansible/ansible:latest", default_duration_hours=2),
            LabTemplate(name="Terraform", description="Terraform infrastructure as code", image="hashicorp/terraform:latest", default_duration_hours=2),
        ]
        for template in default_templates:
            db.add(template)
        db.commit()
    
    db.close()

@app.on_event("shutdown")
async def shutdown_event():
    # Stop the scheduler
    scheduler.stop()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8004)
