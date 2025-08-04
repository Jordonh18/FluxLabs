# Container Manager Service

This service handles Docker container operations for the FluxLabs platform.

## Endpoints

- `POST /containers` - Create a new container
- `GET /containers/{container_id}` - Get container details
- `POST /containers/{container_id}/start` - Start a container
- `POST /containers/{container_id}/stop` - Stop a container
- `DELETE /containers/{container_id}` - Remove a container
- `GET /images` - List available images
- `GET /health` - Health check

## Database Tables

- `containers` - Container information
- `available_images` - Available Docker images

## Port

8003
