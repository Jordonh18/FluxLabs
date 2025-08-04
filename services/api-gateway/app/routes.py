from fastapi import APIRouter, Request, HTTPException, Depends, Header
from fastapi.responses import JSONResponse
import httpx
import os

router = APIRouter()

# Service URLs
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001")
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user-service:8002")
CONTAINER_SERVICE_URL = os.getenv("CONTAINER_SERVICE_URL", "http://container-manager:8003")
LAB_SERVICE_URL = os.getenv("LAB_SERVICE_URL", "http://lab-manager:8004")

async def verify_token(authorization: str = Header(None)):
    """Verify JWT token with auth service"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split(" ")[1]
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{AUTH_SERVICE_URL}/verify",
                headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid token")
            
            data = response.json()
            return data["email"]
        except Exception:
            raise HTTPException(status_code=401, detail="Token verification failed")

async def proxy_request(request: Request, target_url: str, auth_required: bool = True):
    """Proxy request to target service"""
    headers = dict(request.headers)
    
    # Verify authentication if required
    if auth_required:
        await verify_token(headers.get("authorization"))
    
    # Remove host header to avoid conflicts
    headers.pop("host", None)
    
    # Get request body
    body = await request.body()
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body,
                params=request.query_params
            )
            
            return JSONResponse(
                content=response.json() if response.content else {},
                status_code=response.status_code,
                headers=dict(response.headers)
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Service unavailable: {str(e)}")

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
    return await proxy_request(request, f"{LAB_SERVICE_URL}/templates")
