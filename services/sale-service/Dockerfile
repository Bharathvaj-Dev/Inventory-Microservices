
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY services/sale-service/target/*.jar app.jar

COPY infra/otel/opentelemetry-javaagent.jar /otel/opentelemetry-javaagent.jar

EXPOSE 8084

ENV OTEL_SERVICE_NAME="sale-service"

ENV OTEL_EXPORTER_OTLP_ENDPOINT="http://jaeger:4317"

ENV OTEL_EXPORTER_OTLP_PROTOCOL="grpc"

ENV OTEL_RESOURCE_ATTRIBUTES="service.namespace=inventory-microservices"

ENV OTEL_LOGS_EXPORTER="none"

ENV OTEL_METRICS_EXPORTER="none"

ENTRYPOINT ["java", "-jar", "app.jar"]
