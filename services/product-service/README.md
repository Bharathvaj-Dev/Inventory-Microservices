# Product Service

## Overview
Manages product and category data using Spring Boot and PostgreSQL.

## Main API Endpoints
- GET /api/products
- GET /api/products/{id}
- POST /api/products
- PUT /api/products/{id}
- DELETE /api/products/{id}
- GET /api/categories
- GET /api/categories/{id}
- POST /api/categories
- PUT /api/categories/{id}
- DELETE /api/categories/{id}

## Configuration
Docker port: 8081
Database: product_db
Docker database URL uses postgres:5432.

## OpenAPI
- http://localhost:8081/v3/api-docs
- http://localhost:8081/swagger-ui.html

## Run
From the repository root: docker compose --env-file .env.docker up -d --build product-service
