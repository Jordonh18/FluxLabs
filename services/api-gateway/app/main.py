from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
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

app = FastAPI(title="FluxLabs API Gateway", version="1.0.0")

logger.info("API Gateway starting up...")

# Add CORS middleware - Fully permissive for self-hosted applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for self-hosted deployments
    allow_credentials=False,  # Set to False when using allow_origins=["*"]
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

logger.info("CORS configured to allow all origins for self-hosted deployment")

# Include routes
app.include_router(router, prefix="/api/v1")

@app.get("/health")
def health_check():
    logger.info("Health check requested")
    return {"status": "healthy", "service": "api-gateway"}

@app.get("/")
def root():
    logger.info("Root endpoint requested")
    return {"message": "FluxLabs API Gateway", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
