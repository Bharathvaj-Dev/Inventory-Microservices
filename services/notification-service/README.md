# Notification Service

## Overview
Provides notification retrieval and read-status management.

## Main API Endpoints
- GET /api/notifications
- PATCH /api/notifications/{id}/read

## Configuration
Docker port: 8085
Database: notification_db
Messaging integration: LocalStack

## OpenAPI
- http://localhost:8085/v3/api-docs
- http://localhost:8085/swagger-ui.html

## Run
From the repository root: docker compose --env-file .env.docker up -d --build notification-service
