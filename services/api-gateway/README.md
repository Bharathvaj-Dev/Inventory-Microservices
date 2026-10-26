# API Gateway

## Overview
The API Gateway is the single entry point for client requests. It runs on port 8080 and routes requests to the backend services.

## Responsibilities
- Route requests to product, inventory, purchase, sale, and notification services.
- Expose gateway health information.
- Provide the API documentation landing page at `/docs`.
- Expose gateway OpenAPI documentation at `/v3/api-docs`.

## Local URLs
- Gateway: http://localhost:8080
- API Catalog: http://localhost:8080/docs
- Swagger UI: http://localhost:8080/swagger-ui.html
- Health: http://localhost:8080/gateway/health

## Run with Docker Compose
Run these commands from the repository root:

`docker compose --env-file .env.docker up -d --build api-gateway`

## Related Documentation
See `../../README.md` and `../../docs/API-DOCUMENTATION.md`.
