FROM eclipse-temurin:21-jre

WORKDIR /app

COPY services/product-service/target/*.jar app.jar
COPY infra/otel/opentelemetry-javaagent.jar /otel/opentelemetry-javaagent.jar

EXPOSE 8081

ENV JAVA_TOOL_OPTIONS="-javaagent:/otel/opentelemetry-javaagent.jar"

ENV OTEL_SERVICE_NAME="product-service"
ENV OTEL_EXPORTER_OTLP_ENDPOINT="http://jaeger:4317"
ENV OTEL_EXPORTER_OTLP_PROTOCOL="grpc"
ENV OTEL_RESOURCE_ATTRIBUTES="service.namespace=inventory-microservices"

ENTRYPOINT ["java", "-jar", "app.jar"]