from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_database, engine, Base
from models import Lab, LabTemplate
from lab_service import LabService
from scheduler import scheduler
import uvicorn

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Lab Manager", version="1.0.0")
lab_service = LabService()

class LabCreate(BaseModel):
    name: str
    template_id: int
    duration_hours: Optional[int] = None

class LabResponse(BaseModel):
    id: int
    user_id: int
    container_id: Optional[int]
    name: str
    expires_at: str
    persistent: bool
    status: str

class TemplateResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    image: str
    default_duration_hours: int

@app.post("/labs", response_model=LabResponse)
async def create_lab(lab_data: LabCreate, user_id: int, db: Session = Depends(get_database)):
    try:
        lab = await lab_service.create_lab(
            db=db,
            user_id=user_id,
            name=lab_data.name,
            template_id=lab_data.template_id,
            duration_hours=lab_data.duration_hours
        )
        return lab
    except Exception as e:
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
    
    # Add default templates if none exist
    db = next(get_database())
    
    if db.query(LabTemplate).count() == 0:
        default_templates = [
            LabTemplate(name="Ubuntu Lab", description="Basic Ubuntu environment", image="ubuntu", default_duration_hours=1),
            LabTemplate(name="Python Lab", description="Python development environment", image="python:3.11", default_duration_hours=2),
            LabTemplate(name="Node.js Lab", description="Node.js development environment", image="node:18", default_duration_hours=2),
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
