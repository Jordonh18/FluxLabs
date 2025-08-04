# User Service

This service handles user profiles and settings for the FluxLabs platform.

## Endpoints

- `GET /profile/{user_id}` - Get user profile
- `POST /profile/{user_id}` - Create user profile
- `PUT /profile/{user_id}` - Update user profile
- `GET /settings/{user_id}` - Get user settings
- `POST /settings/{user_id}` - Create user settings
- `PUT /settings/{user_id}` - Update user settings
- `GET /health` - Health check

## Database Tables

- `user_profiles` - User profile information
- `user_settings` - User preferences and settings

## Port

8002
