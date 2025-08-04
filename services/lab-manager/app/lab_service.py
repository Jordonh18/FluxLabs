from sqlalchemy.orm import Session
from models import Lab, LabTemplate, ScheduledTask
from datetime import datetime, timedelta
import httpx
import os

CONTAINER_SERVICE_URL = os.getenv("CONTAINER_SERVICE_URL", "http://container-manager:8003")

class LabService:
    def __init__(self):
        self.container_service_url = CONTAINER_SERVICE_URL

    async def create_lab(self, db: Session, user_id: int, name: str, template_id: int, duration_hours: int = None):
        """Create a new lab"""
        # Get template
        template = db.query(LabTemplate).filter(LabTemplate.id == template_id).first()
        if not template:
            raise Exception("Template not found")

        # Calculate expiry time
        hours = duration_hours or template.default_duration_hours
        expires_at = datetime.utcnow() + timedelta(hours=hours)

        # Create lab record
        lab = Lab(
            user_id=user_id,
            name=name,
            expires_at=expires_at,
            status="creating"
        )
        db.add(lab)
        db.commit()
        db.refresh(lab)

        try:
            # Create container via Container Manager
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.container_service_url}/containers",
                    json={"image": template.image, "ssh_enabled": True}
                )
                
                if response.status_code == 200:
                    container_data = response.json()
                    lab.container_id = container_data["id"]
                    lab.status = "running"
                else:
                    lab.status = "error"
                    raise Exception("Failed to create container")

        except Exception as e:
            lab.status = "error"
            db.commit()
            raise e

        db.commit()
        
        # Schedule expiry task
        self.schedule_lab_expiry(db, lab.id, expires_at)
        
        return lab

    def schedule_lab_expiry(self, db: Session, lab_id: int, expires_at: datetime):
        """Schedule lab expiry task"""
        task = ScheduledTask(
            task_type="expire_lab",
            target_id=lab_id,
            execute_at=expires_at
        )
        db.add(task)
        db.commit()

    async def expire_lab(self, db: Session, lab_id: int):
        """Expire a lab and remove its container"""
        lab = db.query(Lab).filter(Lab.id == lab_id).first()
        if not lab:
            return False

        lab.status = "expired"
        
        # Remove container if it exists
        if lab.container_id:
            try:
                async with httpx.AsyncClient() as client:
                    await client.delete(f"{self.container_service_url}/containers/{lab.container_id}")
            except Exception:
                pass  # Container might already be gone

        db.commit()
        return True

    def get_user_labs(self, db: Session, user_id: int):
        """Get all labs for a user"""
        return db.query(Lab).filter(Lab.user_id == user_id).all()

    def get_lab(self, db: Session, lab_id: int):
        """Get a specific lab"""
        return db.query(Lab).filter(Lab.id == lab_id).first()

    def get_templates(self, db: Session):
        """Get all lab templates"""
        return db.query(LabTemplate).all()

    async def extend_lab(self, db: Session, lab_id: int, additional_hours: int):
        """Extend lab duration"""
        lab = db.query(Lab).filter(Lab.id == lab_id).first()
        if not lab or lab.status != "running":
            return False

        # Update expiry time
        lab.expires_at = lab.expires_at + timedelta(hours=additional_hours)
        
        # Update scheduled task
        task = db.query(ScheduledTask).filter(
            ScheduledTask.task_type == "expire_lab",
            ScheduledTask.target_id == lab_id,
            ScheduledTask.status == "pending"
        ).first()
        
        if task:
            task.execute_at = lab.expires_at

        db.commit()
        return True
