# \# Inventory Microservices

#

# A Java Spring Boot microservices application for managing products, categories, inventory, purchases, sales, and notifications. The project uses PostgreSQL databases, Docker Compose, an API Gateway, and asynchronous messaging with AWS SQS/LocalStack.

#

# \## Architecture

#

# \- \*\*API Gateway:\*\* Single entry point for frontend and API requests.

# \- \*\*Product Service:\*\* Product and category management.

# \- \*\*Inventory Service:\*\* Inventory lookup and low-stock monitoring.

# \- \*\*Purchase Service:\*\* Purchase operations and purchase event publishing.

# \- \*\*Sale Service:\*\* Sales operations and inventory-related workflow integration.

# \- \*\*Notification Service:\*\* Notification retrieval and read-status management.

#

# Each service owns its application logic and database configuration. Services communicate through HTTP APIs and asynchronous messaging where configured.

#

# \## Technology Stack

#

# \- Java and Spring Boot

# \- Maven

# \- PostgreSQL

# \- Spring Cloud Gateway and OpenFeign

# \- AWS SQS / LocalStack

# \- Docker and Docker Compose

# \- React and Vite frontend

# \- Postman / Newman API testing

#

# \## Service Ports

#

# | Component | Local Port |

# |---|---:|

# | API Gateway | 8080 |

# | Product Service | 8081 |

# | Inventory Service | 8082 |

# | Purchase Service | 8083 |

# | Sale Service | 8084 |

# | Notification Service | 8085 |

# | Frontend (Vite) | 5173 |

#

# \## API Documentation

#

# See \[API Documentation](docs/API-DOCUMENTATION.md) for the currently documented routes.

#

# Base URL through the API Gateway:

#

# `http://localhost:8080`

#

# \### Main endpoints

#

# | Area | Endpoints |

# |---|---|

# | Products | `/api/products` |

# | Categories | `/api/categories` |

# | Inventory | `/api/inventory` |

# | Purchases | `/api/purchases` |

# | Sales | `/api/sales` |

# | Notifications | `/api/notifications` |

# | Gateway health | `/gateway/health` |

#

# Consult the API reference and controller source for supported HTTP methods and request details.

#

# \## Configuration

#

# 1\. Review `.env.example` and provide values required by your environment.

# 2\. Keep real credentials in local environment files; do not commit secrets.

# 3\. Review `docker-compose.yml` and service configuration before starting the application.

#

# \## Run with Docker Compose

#

# From the repository root:

#

# ```bash

# docker compose --env-file .env.docker config --quiet

# docker compose --env-file .env.docker up -d --build

# docker compose --env-file .env.docker ps

# ```

#

# To inspect logs for a service:

#

# ```bash

# docker compose --env-file .env.docker logs --tail=100 api-gateway

# ```

#

# Stop containers without deleting database volumes:

#

# ```bash

# docker compose --env-file .env.docker down

# ```

#

# Do not use `down -v` unless you intentionally want to remove persistent volumes.

#

# \## Frontend

#

# ```bash

# cd frontend

# npm install

# npm run dev

# ```

#

# Open `http://localhost:5173`. Ensure the backend services and API Gateway are running.

#

# \## API Testing

#

# Use the Postman collections in the repository to validate endpoints through `http://localhost:8080`. Check response status codes, response bodies, and the relevant business workflow. Newman can be used for command-line collection execution when installed.

#

# \## Observability

#

# The Docker Compose environment includes observability components. Check `docker-compose.yml` for the configured services and ports.

#

# \## Project Status

#

# This repository contains the implementation and testing artifacts for the Inventory Microservices project. Actual API availability depends on the running service configuration and dependencies.

#
