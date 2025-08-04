# Lab Manager Service

This service handles high-level lab management and scheduling for the FluxLabs platform.

## Endpoints

- `POST /labs` - Create a new lab
- `GET /labs/user/{user_id}` - Get all labs for a user
- `GET /labs/{lab_id}` - Get lab details
- `POST /labs/{lab_id}/extend` - Extend lab duration
- `DELETE /labs/{lab_id}` - Terminate a lab
- `GET /templates` - List lab templates
- `GET /health` - Health check

## Background Tasks

- Check for expired labs every 5 minutes
- Terminate expired labs
- Remove expired containers

## Database Tables

- `labs` - Lab instances
- `lab_templates` - Available lab templates
- `scheduled_tasks` - Background task scheduling

## Port

8004
