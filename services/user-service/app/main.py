from fastapi import FastAPI, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_database, engine, Base
from crud import (
    get_user_profile, create_user_profile, update_user_profile,
    get_user_settings, create_user_settings, update_user_settings
)
import httpx
import uvicorn
import os
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Create tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Failed to create database tables: {e}")
    raise

app = FastAPI(title="User Service", version="1.0.0")

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001")

logger.info("User Service starting up...")
logger.info(f"Auth service URL: {AUTH_SERVICE_URL}")

class UserProfileCreate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserSettingsCreate(BaseModel):
    auto_extend_labs: Optional[bool] = False
    default_duration: Optional[int] = 60

class UserSettingsUpdate(BaseModel):
    auto_extend_labs: Optional[bool] = None
    default_duration: Optional[int] = None

async def verify_token(authorization: str = Header(None)):
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

# Helper function to get user_id from email (simplified for demo)
def get_user_id_from_email(email: str) -> int:
    # In a real implementation, you'd query the users table
    # For demo purposes, we'll use a simple hash
    return hash(email) % 1000000

@app.get("/profile/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_database), email: str = Depends(verify_token)):
    profile = get_user_profile(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@app.post("/profile/{user_id}")
def create_profile(user_id: int, profile_data: UserProfileCreate, db: Session = Depends(get_database), email: str = Depends(verify_token)):
    return create_user_profile(db, user_id, profile_data.first_name, profile_data.last_name)

@app.put("/profile/{user_id}")
def update_profile(user_id: int, profile_data: UserProfileUpdate, db: Session = Depends(get_database), email: str = Depends(verify_token)):
    return update_user_profile(db, user_id, profile_data.first_name, profile_data.last_name)

@app.get("/settings/{user_id}")
def get_settings(user_id: int, db: Session = Depends(get_database), email: str = Depends(verify_token)):
    settings = get_user_settings(db, user_id)
    if not settings:
        # Create default settings if none exist
        settings = create_user_settings(db, user_id)
    return settings

@app.post("/settings/{user_id}")
def create_settings(user_id: int, settings_data: UserSettingsCreate, db: Session = Depends(get_database), email: str = Depends(verify_token)):
    return create_user_settings(db, user_id, settings_data.auto_extend_labs, settings_data.default_duration)

@app.put("/settings/{user_id}")
def update_settings(user_id: int, settings_data: UserSettingsUpdate, db: Session = Depends(get_database), email: str = Depends(verify_token)):
    return update_user_settings(db, user_id, settings_data.auto_extend_labs, settings_data.default_duration)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
