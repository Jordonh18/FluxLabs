from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_database, engine, Base
from models import Container, AvailableImage
from docker_client import DockerClient
import uvicorn

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Container Manager", version="1.0.0")
docker_client = DockerClient()

class ContainerCreate(BaseModel):
    image: str
    ssh_enabled: Optional[bool] = True

class ContainerResponse(BaseModel):
    id: int
    docker_id: str
    image: str
    status: str
    ssh_port: Optional[int]

class ImageResponse(BaseModel):
    id: int
    name: str
    tag: str
    description: Optional[str]
    ssh_enabled: bool

@app.post("/containers", response_model=ContainerResponse)
def create_container(container_data: ContainerCreate, db: Session = Depends(get_database)):
    try:
        # Create container using Docker client
        docker_id, ssh_port = docker_client.create_container(
            image=container_data.image,
            ssh_enabled=container_data.ssh_enabled
        )
        
        # Save container info to database
        container = Container(
            docker_id=docker_id,
            image=container_data.image,
            status="running",
            ssh_port=ssh_port
        )
        db.add(container)
        db.commit()
        db.refresh(container)
        
        return container
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/containers/{container_id}", response_model=ContainerResponse)
def get_container(container_id: int, db: Session = Depends(get_database)):
    container = db.query(Container).filter(Container.id == container_id).first()
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    
    # Update status from Docker
    status = docker_client.get_container_status(container.docker_id)
    if status and status != container.status:
        container.status = status
        db.commit()
    
    return container

@app.post("/containers/{container_id}/start")
def start_container(container_id: int, db: Session = Depends(get_database)):
    container = db.query(Container).filter(Container.id == container_id).first()
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    
    success = docker_client.start_container(container.docker_id)
    if success:
        container.status = "running"
        db.commit()
        return {"message": "Container started"}
    else:
        raise HTTPException(status_code=500, detail="Failed to start container")

@app.post("/containers/{container_id}/stop")
def stop_container(container_id: int, db: Session = Depends(get_database)):
    container = db.query(Container).filter(Container.id == container_id).first()
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    
    success = docker_client.stop_container(container.docker_id)
    if success:
        container.status = "stopped"
        db.commit()
        return {"message": "Container stopped"}
    else:
        raise HTTPException(status_code=500, detail="Failed to stop container")

@app.delete("/containers/{container_id}")
def remove_container(container_id: int, db: Session = Depends(get_database)):
    container = db.query(Container).filter(Container.id == container_id).first()
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    
    success = docker_client.remove_container(container.docker_id)
    if success:
        db.delete(container)
        db.commit()
        return {"message": "Container removed"}
    else:
        raise HTTPException(status_code=500, detail="Failed to remove container")

@app.get("/images", response_model=list[ImageResponse])
def list_images(db: Session = Depends(get_database)):
    return db.query(AvailableImage).all()

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Initialize some default images
@app.on_event("startup")
async def startup_event():
    db = next(get_database())
    
    # Add default images if none exist
    if db.query(AvailableImage).count() == 0:
        default_images = [
            AvailableImage(name="ubuntu", tag="latest", description="Ubuntu Linux", ssh_enabled=True),
            AvailableImage(name="python", tag="3.11", description="Python 3.11 environment", ssh_enabled=True),
            AvailableImage(name="node", tag="18", description="Node.js 18 environment", ssh_enabled=True),
        ]
        for image in default_images:
            db.add(image)
        db.commit()
    
    db.close()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8003)
