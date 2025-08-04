# FluxLabs - Modular Microservices Platform

FluxLabs is a modular microservices platform that allows users to create ephemeral Linux containers for learning. The platform consists of exactly 5 backend services, an API gateway, and a React frontend.

## Architecture

### Services

1. **API Gateway** (Port 8080) - Routes requests and handles CORS
2. **Auth Service** (Port 8001) - User authentication and JWT management
3. **User Service** (Port 8002) - User profiles and settings
4. **Container Manager** (Port 8003) - Docker container operations
5. **Lab Manager** (Port 8004) - High-level lab management and scheduling
6. **Frontend** (Port 3000) - React web interface

### Database

- **PostgreSQL** - Single shared database for all services
- **Database Name**: `fluxlabs`
- **User**: `fluxuser`
- **Password**: `fluxpass`

## Tech Stack

### Backend
- **Framework**: FastAPI + Python
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Container Runtime**: Docker + Python Docker SDK
- **Validation**: Pydantic
- **HTTP Client**: httpx
- **Background Tasks**: APScheduler

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **HTTP Client**: axios
- **Routing**: React Router DOM
- **Build Tool**: Vite

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Database**: PostgreSQL 15

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Jordonh18/FluxLabs.git
cd FluxLabs
```

2. Copy and configure environment variables:
```bash
cp .env.example .env
# Edit .env file with your preferred settings
```

3. Start all services:
```bash
docker-compose up --build
```

3. Access the application:
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:43121
- **Database**: localhost:54321

### Default Services Ports
- API Gateway: 43121
- Auth Service: 43122
- User Service: 43123
- Container Manager: 43124
- Lab Manager: 43125
- Frontend: 3000
- PostgreSQL: 54321

## API Documentation

### Authentication Flow
1. User registers/logs in via Frontend → API Gateway → Auth Service
2. Auth Service returns JWT token
3. Frontend includes token in Authorization header
4. API Gateway validates token and forwards requests

### Container Lifecycle
1. User creates lab via Lab Manager
2. Lab Manager calls Container Manager to create container
3. Container Manager creates Docker container with SSH access
4. Lab Manager schedules expiry task
5. Background scheduler terminates expired labs

## Development

### Project Structure
```
fluxlabs/
├── services/
│   ├── api-gateway/       # Request routing and CORS
│   ├── auth-service/      # Authentication
│   ├── user-service/      # User profiles
│   ├── container-manager/ # Docker operations
│   └── lab-manager/       # Lab lifecycle
├── frontend/              # React application
├── docker-compose.yml     # Service orchestration
└── README.md
```

### Running Individual Services

Each service can be run independently for development:

```bash
# Auth Service
cd services/auth-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001

# Container Manager
cd services/container-manager
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8003

# Frontend
cd frontend
npm install
npm run dev
```

### Database Schema

The platform uses a single PostgreSQL database with tables distributed across services:

**Auth Service Tables:**
- `users` - User accounts
- `sessions` - User sessions

**User Service Tables:**
- `user_profiles` - User profile information
- `user_settings` - User preferences

**Container Manager Tables:**
- `containers` - Container information
- `available_images` - Available Docker images

**Lab Manager Tables:**
- `labs` - Lab instances
- `lab_templates` - Lab templates
- `scheduled_tasks` - Background task scheduling

## Features

### Core Features
- ✅ User registration and authentication
- ✅ JWT-based session management
- ✅ Docker container creation and management
- ✅ Lab lifecycle management
- ✅ Automatic lab expiry
- ✅ User profiles and settings
- ✅ Multiple lab templates

### Frontend Features
- ✅ Responsive web interface
- ✅ User dashboard
- ✅ Lab creation and management
- ✅ User profile management
- ✅ Real-time lab status updates

### Container Features
- ✅ SSH access to containers
- ✅ Multiple image templates
- ✅ Automatic port assignment
- ✅ Container lifecycle management

## Security

- JWT token-based authentication
- CORS protection
- Input validation with Pydantic
- Secure database connections
- Container isolation

## Monitoring

- Health check endpoints on all services
- Background task monitoring
- Container status tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation in each service's README.md

---

**Note**: This is a learning platform. Do not use in production without proper security hardening.
