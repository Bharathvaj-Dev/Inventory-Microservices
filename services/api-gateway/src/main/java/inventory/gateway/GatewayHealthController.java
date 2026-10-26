package inventory.gateway;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import reactor.core.publisher.Mono;

@RestController
@Tag(name = "Gateway Health", description = "API Gateway and downstream service health APIs")
public class GatewayHealthController {

        private final WebClient webClient = WebClient.builder().build();

        @GetMapping("/gateway/health")
        @Operation(summary = "Check gateway and service health", description = "Checks the health status of all five microservices")
        @ApiResponse(responseCode = "200", description = "Health status retrieved")
        public Mono<Map<String, Object>> gatewayHealth() {

                Mono<Map<String, Object>> product = checkHealth("http://localhost:8081/actuator/health");

                Mono<Map<String, Object>> inventory = checkHealth("http://localhost:8082/actuator/health");

                Mono<Map<String, Object>> purchase = checkHealth("http://localhost:8083/actuator/health");

                Mono<Map<String, Object>> sale = checkHealth("http://localhost:8084/actuator/health");

                Mono<Map<String, Object>> notification = checkHealth("http://localhost:8085/actuator/health");

                return Mono.zip(
                                product,
                                inventory,
                                purchase,
                                sale,
                                notification).map(results -> {

                                        Map<String, Object> services = new LinkedHashMap<>();

                                        services.put("product-service", results.getT1());
                                        services.put("inventory-service", results.getT2());
                                        services.put("purchase-service", results.getT3());
                                        services.put("sale-service", results.getT4());
                                        services.put("notification-service", results.getT5());

                                        boolean allHealthy = services.values().stream()
                                                        .allMatch(result -> result instanceof Map<?, ?> map
                                                                        && "UP".equals(
                                                                                        String.valueOf(map.get(
                                                                                                        "status"))));

                                        Map<String, Object> response = new LinkedHashMap<>();

                                        response.put(
                                                        "status",
                                                        allHealthy ? "UP" : "DEGRADED");

                                        response.put("services", services);

                                        return response;
                                });
        }

        private Mono<Map<String, Object>> checkHealth(String url) {

                return webClient.get()
                                .uri(url)
                                .retrieve()
                                .bodyToMono(Map.class)
                                .map(health -> {

                                        Map<String, Object> result = new LinkedHashMap<>();

                                        if (health != null
                                                        && health.get("status") != null) {

                                                result.put(
                                                                "status",
                                                                String.valueOf(
                                                                                health.get("status")));

                                        } else {
                                                result.put("status", "UNKNOWN");
                                        }

                                        return result;
                                })
                                .onErrorResume(error -> {

                                        Map<String, Object> result = new LinkedHashMap<>();

                                        result.put("status", "DOWN");
                                        result.put(
                                                        "error",
                                                        error.getClass().getSimpleName());
                                        result.put(
                                                        "message",
                                                        error.getMessage());

                                        return Mono.just(result);
                                });
        }
}
