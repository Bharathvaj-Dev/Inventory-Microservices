# Sale Service

## Overview
Handles sales and starts the sale workflow, including inventory-related processing.

## Main API Endpoints
- POST /api/sales
- GET /api/sales

## Configuration
Docker port: 8084
Database: sale_db

## OpenAPI
- http://localhost:8084/v3/api-docs
- http://localhost:8084/swagger-ui.html

## Run
From the repository root: docker compose --env-file .env.docker up -d --build sale-service
