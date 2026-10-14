package inventory.inventory.consumer;

import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

import com.inventory.events.StockInsufficient;
import com.inventory.events.StockReservationRequested;
import com.inventory.events.StockReserved;

import inventory.inventory.entity.InventoryItem;
import inventory.inventory.entity.ProcessedSaga;
import inventory.inventory.repository.InventoryItemRepository;
import inventory.inventory.repository.ProcessedSagaRepository;

import io.awspring.cloud.sqs.annotation.SqsListener;
import io.awspring.cloud.sqs.operations.SqsTemplate;

@Component
public class StockReservationListener {

    private final InventoryItemRepository inventoryItemRepository;
    private final ProcessedSagaRepository processedSagaRepository;
    private final SqsTemplate sqsTemplate;

    public StockReservationListener(
            InventoryItemRepository inventoryItemRepository,
            ProcessedSagaRepository processedSagaRepository,
            SqsTemplate sqsTemplate) {

        this.inventoryItemRepository = inventoryItemRepository;
        this.processedSagaRepository = processedSagaRepository;
        this.sqsTemplate = sqsTemplate;
    }

    @SqsListener("stock-reservation-requests")
    public void handleStockReservation(
            Message<StockReservationRequested> message) {

        StockReservationRequested event = message.getPayload();

        // Idempotency check
        if (processedSagaRepository
                .findBySagaId(event.getSagaId())
                .isPresent()) {

            System.out.println(
                    "Duplicate StockReservationRequested event ignored. Saga ID: "
                            + event.getSagaId()
            );

            return;
        }

        InventoryItem item = inventoryItemRepository
                .findByProductId(event.getProductId())
                .orElse(null);

        if (item == null) {

            StockInsufficient insufficientEvent =
                    new StockInsufficient(
                            event.getSagaId(),
                            event.getProductId(),
                            event.getQuantity(),
                            0
                    );

            sqsTemplate.send(to -> to
                    .queue("stock-insufficient")
                    .payload(insufficientEvent));

            processedSagaRepository.save(
                    new ProcessedSaga(event.getSagaId())
            );

            return;
        }

        if (item.getCurrentStock() < event.getQuantity()) {

            StockInsufficient insufficientEvent =
                    new StockInsufficient(
                            event.getSagaId(),
                            event.getProductId(),
                            event.getQuantity(),
                            item.getCurrentStock()
                    );

            sqsTemplate.send(to -> to
                    .queue("stock-insufficient")
                    .payload(insufficientEvent));

            processedSagaRepository.save(
                    new ProcessedSaga(event.getSagaId())
            );

            return;
        }

        item.setCurrentStock(
                item.getCurrentStock() - event.getQuantity()
        );

        item.setLastUpdated(
                java.time.LocalDateTime.now()
        );

        inventoryItemRepository.save(item);

        StockReserved reservedEvent =
                new StockReserved(
                        event.getSagaId(),
                        event.getProductId(),
                        event.getQuantity()
                );

        sqsTemplate.send(to -> to
                .queue("stock-reserved")
                .payload(reservedEvent));

        processedSagaRepository.save(
                new ProcessedSaga(event.getSagaId())
        );

        System.out.println(
                "Stock reserved successfully. Saga ID: "
                        + event.getSagaId()
        );
    }
}