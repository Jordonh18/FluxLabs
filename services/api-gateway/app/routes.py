from fastapi import APIRouter, Request, HTTPException, Depends, Header
from fastapi.responses import JSONResponse
import httpx
import os
import logging

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Service URLs
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001")
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user-service:8002")
CONTAINER_SERVICE_URL = os.getenv("CONTAINER_SERVICE_URL", "http://container-manager:8003")

logger.info(f"Service URLs configured - AUTH: {AUTH_SERVICE_URL}, USER: {USER_SERVICE_URL}, CONTAINER: {CONTAINER_SERVICE_URL}")

async def verify_token(authorization: str = Header(None)):
    """Verify JWT token with auth service"""
    if not authorization or not authorization.startswith("Bearer "):
        logger.warning("Invalid authorization header received")
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split(" ")[1]
    logger.info(f"Verifying token with auth service")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AUTH_SERVICE_URL}/verify",
                headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code != 200:
                logger.warning(f"Token verification failed with status: {response.status_code}")
                raise HTTPException(status_code=401, detail="Invalid token")
            
            data = response.json()
            logger.info(f"Token verified successfully for user: {data.get('email', 'unknown')}")
            return data["email"]
        except Exception:
            raise HTTPException(status_code=401, detail="Token verification failed")

async def proxy_request(request: Request, target_url: str, auth_required: bool = True):
    """Proxy request to target service"""
    logger.info(f"Proxying {request.method} request to: {target_url}")
    
    headers = dict(request.headers)
    
    # Verify authentication if required
    if auth_required:
        logger.info("Verifying authentication for protected route")
        await verify_token(headers.get("authorization"))
    else:
        logger.info("Skipping authentication for public route")
    
    # Remove host header to avoid conflicts
    headers.pop("host", None)
    
    # Get request body
    body = await request.body()
    if body:
        logger.info(f"Request body size: {len(body)} bytes")
    
    async with httpx.AsyncClient() as client:
        try:
            logger.info(f"Sending request to: {target_url}")
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body,
                params=request.query_params
            )
            
            logger.info(f"Received response from {target_url}: status={response.status_code}")
            
            # Handle response content safely
            try:
                content = response.json() if response.content else {}
            except Exception as json_error:
                logger.error(f"Failed to parse JSON response from {target_url}: {str(json_error)}")
                logger.error(f"Response content: {response.content}")
                content = {"error": "Invalid response format from service"}
            
            return JSONResponse(
                content=content,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
        except httpx.RequestError as e:
            logger.error(f"Request error when calling {target_url}: {str(e)}")
            raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error when calling {target_url}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Auth routes (no auth required)
@router.post("/auth/register")
async def register(request: Request):
    return await proxy_request(request, f"{AUTH_SERVICE_URL}/register", auth_required=False)

@router.post("/auth/login")
async def login(request: Request):
    return await proxy_request(request, f"{AUTH_SERVICE_URL}/login", auth_required=False)

@router.post("/auth/verify")
async def verify(request: Request):
    return await proxy_request(request, f"{AUTH_SERVICE_URL}/verify", auth_required=False)

# User service routes
@router.get("/users/profile/{user_id}")
async def get_user_profile(user_id: int, request: Request):
    return await proxy_request(request, f"{USER_SERVICE_URL}/profile/{user_id}")

@router.post("/users/profile/{user_id}")
async def create_user_profile(user_id: int, request: Request):
    return await proxy_request(request, f"{USER_SERVICE_URL}/profile/{user_id}")

@router.put("/users/profile/{user_id}")
async def update_user_profile(user_id: int, request: Request):
    return await proxy_request(request, f"{USER_SERVICE_URL}/profile/{user_id}")

@router.get("/users/settings/{user_id}")
async def get_user_settings(user_id: int, request: Request):
    return await proxy_request(request, f"{USER_SERVICE_URL}/settings/{user_id}")

@router.post("/users/settings/{user_id}")
async def create_user_settings(user_id: int, request: Request):
    return await proxy_request(request, f"{USER_SERVICE_URL}/settings/{user_id}")

@router.put("/users/settings/{user_id}")
async def update_user_settings(user_id: int, request: Request):
    return await proxy_request(request, f"{USER_SERVICE_URL}/settings/{user_id}")

# Container service routes - simplified Docker-only endpoints
@router.get("/labs")
async def get_labs(user_id: str, request: Request):
    """Get all labs for a user using Docker labels"""
    return await proxy_request(request, f"{CONTAINER_SERVICE_URL}/labs?user_id={user_id}")

@router.post("/create-lab")
async def create_lab(request: Request):
    """Create a new Docker container lab with user labels"""
    return await proxy_request(request, f"{CONTAINER_SERVICE_URL}/create-lab")

@router.get("/lab/{container_id}")
async def get_lab_details(container_id: str, request: Request):
    """Get specific lab details by container ID"""
    return await proxy_request(request, f"{CONTAINER_SERVICE_URL}/lab/{container_id}")

@router.delete("/delete-lab/{container_id}")
async def delete_lab(container_id: str, request: Request):
    """Delete a lab (remove Docker container)"""
    return await proxy_request(request, f"{CONTAINER_SERVICE_URL}/delete-lab/{container_id}")

@router.post("/lab/{container_id}/start")
async def start_lab_container(container_id: str, request: Request):
    """Start a lab container"""
    return await proxy_request(request, f"{CONTAINER_SERVICE_URL}/lab/{container_id}/start")

@router.post("/lab/{container_id}/stop")
async def stop_lab_container(container_id: str, request: Request):
    """Stop a lab container"""
    return await proxy_request(request, f"{CONTAINER_SERVICE_URL}/lab/{container_id}/stop")

@router.post("/lab/{container_id}/restart")
async def restart_lab_container(container_id: str, request: Request):
    """Restart a lab container"""
    return await proxy_request(request, f"{CONTAINER_SERVICE_URL}/lab/{container_id}/restart")

@router.get("/lab/{container_id}/logs")
async def get_lab_logs(container_id: str, request: Request):
    """Get container logs"""
    return await proxy_request(request, f"{CONTAINER_SERVICE_URL}/lab/{container_id}/logs")

@router.get("/lab/{container_id}/stats")
async def get_lab_stats(container_id: str, request: Request):
    """Get container stats"""
    return await proxy_request(request, f"{CONTAINER_SERVICE_URL}/lab/{container_id}/stats")

@router.get("/lab/{container_id}/processes")
async def get_lab_processes(container_id: str, request: Request):
    """Get container processes"""
    return await proxy_request(request, f"{CONTAINER_SERVICE_URL}/lab/{container_id}/processes")

@router.post("/lab/{container_id}/exec")
async def exec_lab_command(container_id: str, request: Request):
    """Execute command in container"""
    return await proxy_request(request, f"{CONTAINER_SERVICE_URL}/lab/{container_id}/exec")

@router.get("/templates")
async def get_lab_templates(request: Request):
    """Get available lab templates"""
    return await proxy_request(request, f"{CONTAINER_SERVICE_URL}/templates", auth_required=False)
