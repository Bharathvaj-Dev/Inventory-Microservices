package inventory.purchase.command;

import java.time.LocalDateTime;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import inventory.purchase.entity.OutboxEvent;
import inventory.purchase.entity.Purchase;
import inventory.purchase.event.PurchasedEvent;
import inventory.purchase.repository.OutboxEventRepository;
import inventory.purchase.repository.PurchaseRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;

@Component
public class CreatePurchaseCommandHandler {

    private final PurchaseRepository purchaseRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;
    private final Counter purchasesCounter;

    public CreatePurchaseCommandHandler(
            PurchaseRepository purchaseRepository,
            OutboxEventRepository outboxEventRepository,
            ObjectMapper objectMapper,
            MeterRegistry meterRegistry) {

        this.purchaseRepository = purchaseRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.objectMapper = objectMapper;

        this.purchasesCounter = Counter.builder("purchases.total")
                .description("Total number of purchases")
                .register(meterRegistry);
    }

    @Transactional
    public Purchase handle(CreatePurchaseCommand command) {

        Purchase newPurchase = new Purchase(
                command.getProductId(),
                command.getQuantity(),
                LocalDateTime.now()
        );

        Purchase savedPurchase = purchaseRepository.save(newPurchase);

        PurchasedEvent event = new PurchasedEvent(
                savedPurchase.getPurchaseId(),
                savedPurchase.getProductId(),
                savedPurchase.getQuantity(),
                savedPurchase.getPurchaseDate()
        );

        try {

            String payload = objectMapper.writeValueAsString(event);

            OutboxEvent outboxEvent = new OutboxEvent(
                    "PurchasedEvent",
                    payload
            );

            outboxEventRepository.save(outboxEvent);

        } catch (JsonProcessingException e) {

            throw new RuntimeException(
                    "Failed to serialize PurchasedEvent",
                    e
            );
        }

        // Increment only after purchase + outbox save succeeds
        purchasesCounter.increment();

        return savedPurchase;
    }
}
