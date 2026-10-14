FROM eclipse-temurin:21-jre

WORKDIR /app

COPY services/notification-service/target/*.jar app.jar

EXPOSE 8085

ENTRYPOINT ["java", "-jar", "app.jar"]