from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from docker_client import DockerClient
import uvicorn
import logging
import sys
import json
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Container Manager - Docker Only", version="2.0.0")
docker_client = DockerClient()

logger.info("Container Manager (Docker-only) starting up...")

# Pydantic models
class LabCreateRequest(BaseModel):
    name: str
    template_id: str
    user_id: str
    duration_hours: Optional[int] = 24
    image: Optional[str] = None

class LabResponse(BaseModel):
    id: str
    container_id: str
    name: str
    template_id: str
    user_id: str
    status: str
    docker_status: str
    created_at: str
    image: str
    ports: List[Dict[str, Any]] = []
    ssh_info: Optional[Dict[str, str]] = None

class ExecRequest(BaseModel):
    command: str

class TemplateResponse(BaseModel):
    id: str
    name: str
    image: str
    description: str

# Template configurations
TEMPLATES = {
    "ubuntu": {
        "name": "Ubuntu 22.04",
        "image": "ubuntu:22.04",
        "description": "Basic Ubuntu environment with SSH"
    },
    "python": {
        "name": "Python 3.11",
        "image": "python:3.11",
        "description": "Python development environment"
    },
    "node": {
        "name": "Node.js 18",
        "image": "node:18",
        "description": "Node.js development environment"
    },
    "nginx": {
        "name": "Nginx Web Server",
        "image": "nginx:latest",
        "description": "Nginx web server"
    }
}

@app.get("/labs")
def get_user_labs(user_id: str = Query(...)):
    """Get all labs for a user using Docker labels"""
    try:
        containers = docker_client.list_containers_by_label("fluxlabs.user_id", user_id)
        labs = []
        
        for container in containers:
            lab_data = _container_to_lab_response(container)
            if lab_data:
                labs.append(lab_data)
        
        return {"data": labs}
    except Exception as e:
        logger.error(f"Error getting user labs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create-lab")
def create_lab(lab_data: LabCreateRequest):
    """Create a new Docker container lab with user labels"""
    try:
        # Get image from template or use provided image
        image = lab_data.image
        if not image and lab_data.template_id in TEMPLATES:
            image = TEMPLATES[lab_data.template_id]["image"]
        elif not image:
            image = "ubuntu:22.04"  # Default fallback
        
        # Create labels for the container
        labels = {
            "fluxlabs.user_id": lab_data.user_id,
            "fluxlabs.name": lab_data.name,
            "fluxlabs.template": lab_data.template_id,
            "fluxlabs.created_at": datetime.now().isoformat(),
            "fluxlabs.duration_hours": str(lab_data.duration_hours),
            "fluxlabs.created_by": "FluxLabs"
        }
        
        # Create container using Docker client
        container_id = docker_client.create_container_with_labels(
            image=image,
            name=f"fluxlabs-{lab_data.name}-{lab_data.user_id}",
            labels=labels
        )
        
        # Get container details for response
        container = docker_client.get_container_by_id(container_id)
        lab_response = _container_to_lab_response(container)
        
        return {"data": lab_response}
        
    except Exception as e:
        logger.error(f"Error creating lab: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/lab/{container_id}")
def get_lab_details(container_id: str):
    """Get specific lab details by container ID"""
    try:
        container = docker_client.get_container_by_id(container_id)
        if not container:
            raise HTTPException(status_code=404, detail="Lab not found")
        
        lab_data = _container_to_lab_response(container)
        return {"data": lab_data}
    except Exception as e:
        logger.error(f"Error getting lab details: {e}")
        if "404" in str(e):
            raise HTTPException(status_code=404, detail="Lab not found")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete-lab/{container_id}")
def delete_lab(container_id: str):
    """Delete a lab (remove Docker container)"""
    try:
        success = docker_client.remove_container(container_id)
        if success:
            return {"message": "Lab deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete lab")
    except Exception as e:
        logger.error(f"Error deleting lab: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/lab/{container_id}/start")
def start_lab(container_id: str):
    """Start a lab container"""
    try:
        success = docker_client.start_container(container_id)
        if success:
            return {"message": "Lab started successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to start lab")
    except Exception as e:
        logger.error(f"Error starting lab: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/lab/{container_id}/stop")
def stop_lab(container_id: str):
    """Stop a lab container"""
    try:
        success = docker_client.stop_container(container_id)
        if success:
            return {"message": "Lab stopped successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to stop lab")
    except Exception as e:
        logger.error(f"Error stopping lab: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/lab/{container_id}/restart")
def restart_lab(container_id: str):
    """Restart a lab container"""
    try:
        success = docker_client.restart_container(container_id)
        if success:
            return {"message": "Lab restarted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to restart lab")
    except Exception as e:
        logger.error(f"Error restarting lab: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/lab/{container_id}/logs")
def get_lab_logs(container_id: str):
    """Get container logs"""
    try:
        logs = docker_client.get_container_logs(container_id)
        return {"logs": logs}
    except Exception as e:
        logger.error(f"Error getting lab logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/lab/{container_id}/stats")
def get_lab_stats(container_id: str):
    """Get container stats"""
    try:
        stats = docker_client.get_container_stats(container_id)
        return {"stats": stats}
    except Exception as e:
        logger.error(f"Error getting lab stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/lab/{container_id}/processes")
def get_lab_processes(container_id: str):
    """Get container processes"""
    try:
        processes = docker_client.get_container_processes(container_id)
        return {"processes": processes}
    except Exception as e:
        logger.error(f"Error getting lab processes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/lab/{container_id}/exec")
def exec_lab_command(container_id: str, exec_data: ExecRequest):
    """Execute command in container"""
    try:
        result = docker_client.exec_command(container_id, exec_data.command)
        return {"result": result}
    except Exception as e:
        logger.error(f"Error executing command: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/templates")
def get_lab_templates():
    """Get available lab templates"""
    templates = []
    for template_id, template_data in TEMPLATES.items():
        templates.append({
            "id": template_id,
            "name": template_data["name"],
            "image": template_data["image"],
            "description": template_data["description"]
        })
    return {"data": templates}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "container-manager-docker-only"}

def _container_to_lab_response(container: Dict[str, Any]) -> Optional[LabResponse]:
    """Convert Docker container to lab response format"""
    try:
        if not container:
            return None
            
        labels = container.get("Labels") or {}
        config = container.get("Config", {})
        network_settings = container.get("NetworkSettings", {})
        state = container.get("State", {})
        
        # Extract SSH info
        ssh_info = None
        ports = network_settings.get("Ports", {})
        if "22/tcp" in ports and ports["22/tcp"]:
            host_port = ports["22/tcp"][0].get("HostPort")
            if host_port:
                ssh_info = {
                    "host": "localhost",
                    "port": host_port,
                    "command": f"ssh root@localhost -p {host_port}"
                }
        
        # Convert ports to simple format
        port_list = []
        if isinstance(container.get("Ports"), list):
            port_list = container["Ports"]
        
        return LabResponse(
            id=container["Id"],
            container_id=container["Id"],
            name=labels.get("fluxlabs.name", container.get("Names", ["Unknown"])[0].replace("/", "")),
            template_id=labels.get("fluxlabs.template", "unknown"),
            user_id=labels.get("fluxlabs.user_id", "unknown"),
            status=state.get("Status", "unknown").lower(),
            docker_status=container.get("Status", "Unknown"),
            created_at=container.get("Created", ""),
            image=config.get("Image", "unknown"),
            ports=port_list,
            ssh_info=ssh_info
        )
    except Exception as e:
        logger.error(f"Error converting container to lab response: {e}")
        return None

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8003)
