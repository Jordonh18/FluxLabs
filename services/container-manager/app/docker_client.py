import docker
import random
from typing import Optional

class DockerClient:
    def __init__(self):
        self.client = docker.from_env()

    def create_container(self, image: str, ssh_enabled: bool = True) -> tuple[str, Optional[int]]:
        """Create a new container and return docker_id and ssh_port"""
        try:
            # Generate random SSH port if SSH is enabled
            ssh_port = None
            port_bindings = {}
            
            if ssh_enabled:
                ssh_port = random.randint(2200, 2299)
                port_bindings = {'22/tcp': ssh_port}

            container = self.client.containers.run(
                image=image,
                detach=True,
                ports=port_bindings,
                remove=False,
                name=f"fluxlab-{random.randint(10000, 99999)}"
            )
            
            return container.id, ssh_port
        
        except Exception as e:
            raise Exception(f"Failed to create container: {str(e)}")

    def start_container(self, docker_id: str) -> bool:
        """Start a container"""
        try:
            container = self.client.containers.get(docker_id)
            container.start()
            return True
        except Exception:
            return False

    def stop_container(self, docker_id: str) -> bool:
        """Stop a container"""
        try:
            container = self.client.containers.get(docker_id)
            container.stop()
            return True
        except Exception:
            return False

    def remove_container(self, docker_id: str) -> bool:
        """Remove a container"""
        try:
            container = self.client.containers.get(docker_id)
            container.remove(force=True)
            return True
        except Exception:
            return False

    def get_container_status(self, docker_id: str) -> Optional[str]:
        """Get container status"""
        try:
            container = self.client.containers.get(docker_id)
            container.reload()
            return container.status
        except Exception:
            return None

    def list_available_images(self) -> list:
        """List available Docker images"""
        try:
            images = self.client.images.list()
            return [{"name": img.tags[0] if img.tags else "none", "id": img.id} for img in images]
        except Exception:
            return []
