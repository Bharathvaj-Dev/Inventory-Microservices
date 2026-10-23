# Inventory Microservices - API Documentation

## Base URL

`http://localhost:8080`

## Product APIs

- GET /api/products
- GET /api/products/{id}
- POST /api/products
- PUT /api/products/{id}
- DELETE /api/products/{id}

## Category APIs

- GET /api/categories
- GET /api/categories/{id}
- POST /api/categories
- PUT /api/categories/{id}
- DELETE /api/categories/{id}

## Inventory APIs

- GET /api/inventory
- GET /api/inventory/{productId}
- GET /api/inventory/low-stock

## Purchase APIs

- GET /api/purchases
- POST /api/purchases

## Sale APIs

- POST /api/sales
- GET /api/sales

## Notification APIs

- GET /api/notifications
- PATCH /api/notifications/{id}/read

## Gateway Health

- GET /gateway/health

## Service Ports

- API Gateway: 8080
- Product Service: 8081
- Inventory Service: 8082
- Purchase Service: 8083
- Sale Service: 8084
- Notification Service: 8085

## Testing

Use the Postman collection in the repository to test APIs through the gateway. Validate HTTP status codes and response bodies.
