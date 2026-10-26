# Inventory Service

## Overview
Provides inventory lookup and low-stock monitoring using Spring Boot and PostgreSQL.

## Main API Endpoints
- GET /api/inventory
- GET /api/inventory/{productId}
- GET /api/inventory/low-stock

## Configuration
Docker port: 8082
Database: inventory_db
Docker database host: postgres:5432

## OpenAPI
- http://localhost:8082/v3/api-docs
- http://localhost:8082/swagger-ui.html

## Run
From the repository root: docker compose --env-file .env.docker up -d --build inventory-service
