import docker
import random
import json
from typing import Optional, List, Dict, Any

class DockerClient:
    def __init__(self):
        self.client = docker.from_env()

    def create_container_with_labels(self, image: str, name: str, labels: Dict[str, str]) -> str:
        """Create a new container with FluxLabs labels"""
        try:
            # Generate random SSH port
            ssh_port = random.randint(2200, 2299)
            
            # Port bindings for SSH and web
            port_bindings = {
                '22/tcp': ssh_port,
                '80/tcp': random.randint(8000, 8999),  # Web port
                '3000/tcp': random.randint(9000, 9999)  # Dev server port
            }

            # Add FluxLabs prefix to all labels
            fluxlabs_labels = {f"{key}": value for key, value in labels.items()}
            
            container = self.client.containers.run(
                image=image,
                detach=True,
                ports=port_bindings,
                remove=False,
                name=name,
                labels=fluxlabs_labels,
                # Basic setup for SSH and common tools
                environment={
                    'SSH_PORT': str(ssh_port)
                }
            )
            
            return container.id
        
        except Exception as e:
            raise Exception(f"Failed to create container: {str(e)}")

    def list_containers_by_label(self, label_key: str, label_value: str) -> List[Dict[str, Any]]:
        """List containers filtered by a specific label"""
        try:
            filters = {
                'label': f"{label_key}={label_value}"
            }
            containers = self.client.containers.list(all=True, filters=filters)
            
            result = []
            for container in containers:
                container_info = self._get_container_info(container)
                if container_info:
                    result.append(container_info)
            
            return result
        
        except Exception as e:
            raise Exception(f"Failed to list containers: {str(e)}")

    def get_container_by_id(self, container_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed container information by ID"""
        try:
            container = self.client.containers.get(container_id)
            return self._get_detailed_container_info(container)
        except Exception as e:
            raise Exception(f"Failed to get container: {str(e)}")

    def start_container(self, container_id: str) -> bool:
        """Start a container"""
        try:
            container = self.client.containers.get(container_id)
            container.start()
            return True
        except Exception:
            return False

    def stop_container(self, container_id: str) -> bool:
        """Stop a container"""
        try:
            container = self.client.containers.get(container_id)
            container.stop()
            return True
        except Exception:
            return False

    def restart_container(self, container_id: str) -> bool:
        """Restart a container"""
        try:
            container = self.client.containers.get(container_id)
            container.restart()
            return True
        except Exception:
            return False

    def remove_container(self, container_id: str) -> bool:
        """Remove a container"""
        try:
            container = self.client.containers.get(container_id)
            container.remove(force=True)
            return True
        except Exception:
            return False

    def get_container_logs(self, container_id: str, tail: int = 100) -> str:
        """Get container logs"""
        try:
            container = self.client.containers.get(container_id)
            logs = container.logs(tail=tail, timestamps=True)
            return logs.decode('utf-8')
        except Exception as e:
            return f"Error getting logs: {str(e)}"

    def get_container_stats(self, container_id: str) -> Dict[str, Any]:
        """Get container stats"""
        try:
            container = self.client.containers.get(container_id)
            stats = container.stats(stream=False)
            return stats
        except Exception as e:
            return {"error": str(e)}

    def get_container_processes(self, container_id: str) -> List[Dict[str, Any]]:
        """Get container processes"""
        try:
            container = self.client.containers.get(container_id)
            processes = container.top()
            return processes
        except Exception as e:
            return {"error": str(e)}

    def exec_command(self, container_id: str, command: str) -> Dict[str, Any]:
        """Execute command in container"""
        try:
            container = self.client.containers.get(container_id)
            exec_result = container.exec_run(command, stdout=True, stderr=True)
            
            return {
                "exit_code": exec_result.exit_code,
                "output": exec_result.output.decode('utf-8')
            }
        except Exception as e:
            return {"error": str(e)}

    def _get_container_info(self, container) -> Optional[Dict[str, Any]]:
        """Get basic container information for list view"""
        try:
            container.reload()
            
            # Get port mappings
            ports = []
            if container.ports:
                for container_port, host_bindings in container.ports.items():
                    if host_bindings:
                        for binding in host_bindings:
                            ports.append({
                                "PrivatePort": int(container_port.split('/')[0]),
                                "PublicPort": int(binding["HostPort"]),
                                "Type": container_port.split('/')[1],
                                "IP": binding["HostIp"]
                            })
            
            return {
                "Id": container.id,
                "Names": [container.name],
                "Image": container.image.tags[0] if container.image.tags else "unknown",
                "State": container.status,
                "Status": container.status,
                "Created": container.attrs["Created"],
                "Ports": ports,
                "Labels": container.labels or {}
            }
        except Exception as e:
            return None

    def _get_detailed_container_info(self, container) -> Optional[Dict[str, Any]]:
        """Get detailed container information for details view"""
        try:
            container.reload()
            attrs = container.attrs
            
            # Get network settings
            network_settings = attrs.get("NetworkSettings", {})
            ports_dict = {}
            
            if network_settings.get("Ports"):
                for container_port, host_bindings in network_settings["Ports"].items():
                    if host_bindings:
                        ports_dict[container_port] = host_bindings
            
            return {
                "Id": container.id,
                "Name": container.name,
                "Names": [container.name],
                "Config": {
                    "Image": attrs.get("Config", {}).get("Image", "unknown"),
                    "Labels": attrs.get("Config", {}).get("Labels", {})
                },
                "State": {
                    "Status": container.status,
                    "StartedAt": attrs.get("State", {}).get("StartedAt"),
                    "FinishedAt": attrs.get("State", {}).get("FinishedAt")
                },
                "NetworkSettings": {
                    "Ports": ports_dict
                },
                "Created": attrs.get("Created"),
                "Image": container.image.tags[0] if container.image.tags else "unknown",
                "Labels": container.labels or {}
            }
        except Exception as e:
            return None
