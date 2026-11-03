package inventory.inventory.consumer;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.events.StockInsufficient;
import com.inventory.events.StockReservationRequested;
import com.inventory.events.StockReserved;

import inventory.inventory.entity.InventoryItem;
import inventory.inventory.entity.OutboxEvent;
import inventory.inventory.entity.ProcessedSaga;
import inventory.inventory.event.LowStockAlert;
import inventory.inventory.repository.InventoryItemRepository;
import inventory.inventory.repository.OutboxEventRepository;
import inventory.inventory.repository.ProcessedSagaRepository;

import io.awspring.cloud.sqs.annotation.SqsListener;

@Component
public class StockReservationListener {

    private final InventoryItemRepository inventoryItemRepository;
    private final ProcessedSagaRepository processedSagaRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;

    public StockReservationListener(
            InventoryItemRepository inventoryItemRepository,
            ProcessedSagaRepository processedSagaRepository,
            OutboxEventRepository outboxEventRepository,
            ObjectMapper objectMapper,
            TransactionTemplate transactionTemplate) {

        this.inventoryItemRepository = inventoryItemRepository;
        this.processedSagaRepository = processedSagaRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.objectMapper = objectMapper;
        this.transactionTemplate = transactionTemplate;
    }

    @SqsListener("stock-reservation-requests")
    public void handleStockReservation(
            Message<StockReservationRequested> message) {

        StockReservationRequested event = message.getPayload();

        try {
            transactionTemplate.executeWithoutResult(status ->
                    processReservation(event));
        } catch (RuntimeException e) {
            System.err.println(
                    "Stock reservation transaction failed. Saga ID: "
                            + event.getSagaId()
                            + ", Error: " + e.getMessage());
            throw e;
        }
    }

    @Transactional
    public void processReservation(StockReservationRequested event) {

        String sagaId = event.getSagaId();

        if (processedSagaRepository.findBySagaId(sagaId).isPresent()) {
            System.out.println(
                    "Duplicate reservation ignored. Saga ID: " + sagaId);
            return;
        }

        InventoryItem item = inventoryItemRepository
                .findByProductId(event.getProductId())
                .orElse(null);

        if (item == null) {
            StockInsufficient insufficient = new StockInsufficient(
                    sagaId, event.getProductId(), event.getQuantity(), 0);

            saveOutbox("STOCK_INSUFFICIENT", insufficient);
            processedSagaRepository.save(new ProcessedSaga(sagaId));
            return;
        }

        if (item.getCurrentStock() < event.getQuantity()) {
            StockInsufficient insufficient = new StockInsufficient(
                    sagaId,
                    event.getProductId(),
                    event.getQuantity(),
                    item.getCurrentStock());

            saveOutbox("STOCK_INSUFFICIENT", insufficient);
            processedSagaRepository.save(new ProcessedSaga(sagaId));

            System.out.println(
                    "Insufficient stock. Product: " + event.getProductId()
                            + ", Available: " + item.getCurrentStock()
                            + ", Requested: " + event.getQuantity()
                            + ", Saga ID: " + sagaId);
            return;
        }

        item.setCurrentStock(item.getCurrentStock() - event.getQuantity());
        item.setLastUpdated(LocalDateTime.now());
        inventoryItemRepository.save(item);

        if (item.getCurrentStock() < 10) {
            LowStockAlert alert = new LowStockAlert(
                    UUID.randomUUID().toString(),
                    item.getProductId(),
                    item.getCurrentStock(),
                    LocalDateTime.now());

            saveOutbox("LOW_STOCK_ALERT", alert);

            System.out.println(
                    "Low-stock alert saved to outbox. Product: "
                            + item.getProductId()
                            + ", Stock: " + item.getCurrentStock()
                            + ", Saga ID: " + sagaId);
        }

        StockReserved reserved = new StockReserved(
                sagaId, event.getProductId(), event.getQuantity());

        saveOutbox("STOCK_RESERVED", reserved);
        processedSagaRepository.save(new ProcessedSaga(sagaId));

        System.out.println(
                "Stock reservation committed. Product: "
                        + item.getProductId()
                        + ", Quantity: " + event.getQuantity()
                        + ", Remaining stock: " + item.getCurrentStock()
                        + ", Saga ID: " + sagaId);
    }

    private void saveOutbox(String eventType, Object event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            outboxEventRepository.save(new OutboxEvent(eventType, payload));
        } catch (Exception e) {
            throw new IllegalStateException(
                    "Failed to serialize outbox event: " + eventType, e);
        }
    }
}