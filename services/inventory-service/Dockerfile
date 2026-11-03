FROM eclipse-temurin:21-jre

WORKDIR /app

COPY services/inventory-service/target/*.jar app.jar
COPY infra/otel/opentelemetry-javaagent.jar /otel/opentelemetry-javaagent.jar

EXPOSE 8082

ENV JAVA_TOOL_OPTIONS="-javaagent:/otel/opentelemetry-javaagent.jar"
ENV OTEL_SERVICE_NAME="inventory-service"
ENV OTEL_EXPORTER_OTLP_ENDPOINT="http://jaeger:4317"
ENV OTEL_EXPORTER_OTLP_PROTOCOL="grpc"
ENV OTEL_RESOURCE_ATTRIBUTES="service.namespace=inventory-microservices"
ENV OTEL_METRICS_EXPORTER="none"
ENV OTEL_LOGS_EXPORTER="none"

ENTRYPOINT ["java", "-jar", "app.jar"]
