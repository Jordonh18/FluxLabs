from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import timedelta
from database import get_database, engine, Base
from auth import (
    authenticate_user, create_user, get_user_by_email, 
    create_access_token, verify_token, save_session, ACCESS_TOKEN_EXPIRE_MINUTES
)
import uvicorn
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

app = FastAPI(title="Auth Service", version="1.0.0")
security = HTTPBearer()

logger.info("Auth Service starting up...")

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str

@app.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_database)):
    logger.info(f"Registration attempt for email: {user.email}")
    
    try:
        # Check if user already exists
        db_user = get_user_by_email(db, email=user.email)
        if db_user:
            logger.warning(f"Registration failed - email already exists: {user.email}")
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        # Create new user
        logger.info(f"Creating new user: {user.email}")
        new_user = create_user(db=db, email=user.email, password=user.password)
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": new_user.email}, expires_delta=access_token_expires
        )
        
        # Save session
        save_session(db, new_user.id, access_token)
        
        logger.info(f"Registration successful for: {user.email}")
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration failed for {user.email}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during registration"
        )

@app.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_database)):
    logger.info(f"Login attempt for email: {user_credentials.email}")
    
    try:
        user = authenticate_user(db, user_credentials.email, user_credentials.password)
        if not user:
            logger.warning(f"Login failed - invalid credentials for: {user_credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        # Save session
        save_session(db, user.id, access_token)
        
        logger.info(f"Login successful for: {user_credentials.email}")
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed for {user_credentials.email}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during login"
        )

@app.post("/verify")
def verify_token_endpoint(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    email = verify_token(token)
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"email": email, "valid": True}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
