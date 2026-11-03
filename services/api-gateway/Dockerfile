
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY services/api-gateway/target/*.jar app.jar

COPY infra/otel/opentelemetry-javaagent.jar /otel/opentelemetry-javaagent.jar

EXPOSE 8080

ENV JAVA_TOOL_OPTIONS="-javaagent:/otel/opentelemetry-javaagent.jar"
ENV OTEL_SERVICE_NAME="api-gateway"
ENV OTEL_EXPORTER_OTLP_ENDPOINT="http://jaeger:4317"
ENV OTEL_EXPORTER_OTLP_PROTOCOL="grpc"
ENV OTEL_RESOURCE_ATTRIBUTES="service.namespace=inventory-microservices"
ENV OTEL_LOGS_EXPORTER="none"
ENV OTEL_METRICS_EXPORTER="none"

ENTRYPOINT ["java", "-jar", "app.jar"]
