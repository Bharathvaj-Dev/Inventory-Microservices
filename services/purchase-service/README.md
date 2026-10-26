# Purchase Service

## Overview
Handles purchase requests and integrates with asynchronous messaging for inventory-related workflows.

## Main API Endpoints
- GET /api/purchases
- POST /api/purchases

## Configuration
Docker port: 8083
Database: purchase_db
Messaging: LocalStack SQS

## OpenAPI
- http://localhost:8083/v3/api-docs
- http://localhost:8083/swagger-ui.html

## Run
From the repository root: docker compose --env-file .env.docker up -d --build purchase-service
