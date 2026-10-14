
package inventory.sale.service;

import java.util.concurrent.CompletableFuture;

import org.springframework.stereotype.Service;

import inventory.sale.client.InventoryFeignClient;
import inventory.sale.dto.InventoryResponse;
import inventory.sale.exception.InventoryServiceUnavailableException;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryRegistry;
import io.github.resilience4j.retry.annotation.Retry.*;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;

@Service
public class InventoryCircuitBreakerService {

    private final InventoryFeignClient inventoryFeignClient;

    public InventoryCircuitBreakerService(
            InventoryFeignClient inventoryFeignClient,
            RetryRegistry retryRegistry) {

        this.inventoryFeignClient = inventoryFeignClient;

        Retry retry = retryRegistry.retry("inventory");

        retry.getEventPublisher()
                .onRetry(event ->
                        System.out.println(
                                "RETRY ATTEMPT: "
                                        + event.getNumberOfRetryAttempts()
                                        + " | Cause: "
                                        + event.getLastThrowable()
                        )
                );
    }

    @CircuitBreaker(
            name = "inventory",
            fallbackMethod = "inventoryFallback"
    )
    @io.github.resilience4j.retry.annotation.Retry(
            name = "inventory",
            fallbackMethod = "retryFallback"
    )
    @TimeLimiter(name = "inventory")
    public CompletableFuture<InventoryResponse> getInventory(Long productId) {

        return CompletableFuture.supplyAsync(() ->
                inventoryFeignClient.getInventoryByProductId(productId)
        );
    }

    public CompletableFuture<InventoryResponse> retryFallback(
            Long productId,
            Throwable throwable) {

        throw new InventoryServiceUnavailableException(
                "Inventory service unavailable after retries. Please try again later."
        );
    }

    public CompletableFuture<InventoryResponse> inventoryFallback(
            Long productId,
            Throwable throwable) {

        throw new InventoryServiceUnavailableException(
                "Inventory service is unavailable. Please try again later."
        );
    }
}
