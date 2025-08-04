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
LAB_SERVICE_URL = os.getenv("LAB_SERVICE_URL", "http://lab-manager:8004")

logger.info(f"Service URLs configured - AUTH: {AUTH_SERVICE_URL}, USER: {USER_SERVICE_URL}, CONTAINER: {CONTAINER_SERVICE_URL}, LAB: {LAB_SERVICE_URL}")

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
            
            return JSONResponse(
                content=response.json() if response.content else {},
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

# Container service routes
@router.post("/containers")
async def create_container(request: Request):
    return await proxy_request(request, f"{CONTAINER_SERVICE_URL}/containers")

@router.get("/containers/{container_id}")
async def get_container(container_id: int, request: Request):
    return await proxy_request(request, f"{CONTAINER_SERVICE_URL}/containers/{container_id}")

@router.post("/containers/{container_id}/start")
async def start_container(container_id: int, request: Request):
    return await proxy_request(request, f"{CONTAINER_SERVICE_URL}/containers/{container_id}/start")

@router.post("/containers/{container_id}/stop")
async def stop_container(container_id: int, request: Request):
    return await proxy_request(request, f"{CONTAINER_SERVICE_URL}/containers/{container_id}/stop")

@router.delete("/containers/{container_id}")
async def remove_container(container_id: int, request: Request):
    return await proxy_request(request, f"{CONTAINER_SERVICE_URL}/containers/{container_id}")

@router.get("/containers/images")
async def list_images(request: Request):
    return await proxy_request(request, f"{CONTAINER_SERVICE_URL}/images")

# Lab service routes
@router.post("/labs")
async def create_lab(request: Request):
    return await proxy_request(request, f"{LAB_SERVICE_URL}/labs")

@router.get("/labs/user/{user_id}")
async def get_user_labs(user_id: int, request: Request):
    return await proxy_request(request, f"{LAB_SERVICE_URL}/labs/user/{user_id}")

@router.get("/labs/{lab_id}")
async def get_lab(lab_id: int, request: Request):
    return await proxy_request(request, f"{LAB_SERVICE_URL}/labs/{lab_id}")

@router.post("/labs/{lab_id}/extend")
async def extend_lab(lab_id: int, request: Request):
    return await proxy_request(request, f"{LAB_SERVICE_URL}/labs/{lab_id}/extend")

@router.delete("/labs/{lab_id}")
async def terminate_lab(lab_id: int, request: Request):
    return await proxy_request(request, f"{LAB_SERVICE_URL}/labs/{lab_id}")

@router.get("/labs/templates")
async def get_templates(request: Request):
    return await proxy_request(request, f"{LAB_SERVICE_URL}/templates", auth_required=False)
