# API Gateway Service

This service routes requests to other services and handles CORS for the FluxLabs platform.

## Features

- Request routing to microservices
- JWT token verification
- CORS handling for frontend
- Request/response proxying

## Routes

All routes are prefixed with `/api/v1`

### Auth Routes (no auth required)
- `POST /auth/register`
- `POST /auth/login` 
- `POST /auth/verify`

### User Routes (auth required)
- `GET /users/profile/{user_id}`
- `POST /users/profile/{user_id}`
- `PUT /users/profile/{user_id}`
- `GET /users/settings/{user_id}`
- `POST /users/settings/{user_id}`
- `PUT /users/settings/{user_id}`

### Container Routes (auth required)
- `POST /containers`
- `GET /containers/{container_id}`
- `POST /containers/{container_id}/start`
- `POST /containers/{container_id}/stop`
- `DELETE /containers/{container_id}`
- `GET /containers/images`

### Lab Routes (auth required)
- `POST /labs`
- `GET /labs/user/{user_id}`
- `GET /labs/{lab_id}`
- `POST /labs/{lab_id}/extend`
- `DELETE /labs/{lab_id}`
- `GET /labs/templates`

## Port

8080
