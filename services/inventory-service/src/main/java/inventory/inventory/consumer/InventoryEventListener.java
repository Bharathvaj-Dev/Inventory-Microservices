package inventory.inventory.consumer;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import inventory.inventory.entity.ProcessedMessage;
import inventory.inventory.event.PurchasedEvent;
import inventory.inventory.repository.ProcessedMessageRepository;
import inventory.inventory.service.InventoryService;

import io.awspring.cloud.sqs.annotation.SqsListener;
import io.awspring.cloud.sqs.listener.SqsHeaders;

@Component
public class InventoryEventListener {

    private static final Logger log =
            LoggerFactory.getLogger(InventoryEventListener.class);

    private final InventoryService inventoryService;
    private final ProcessedMessageRepository processedMessageRepository;

    public InventoryEventListener(
            InventoryService inventoryService,
            ProcessedMessageRepository processedMessageRepository) {

        this.inventoryService = inventoryService;
        this.processedMessageRepository = processedMessageRepository;
    }

    @SqsListener("purchase-events")
    @Transactional
    public void handlePurchase(Message<PurchasedEvent> message) {

        String messageId =
                message.getHeaders().get(
                        SqsHeaders.SQS_RAW_MESSAGE_ID_HEADER,
                        String.class);

        String correlationId =
                message.getHeaders().get(
                        "X-Correlation-ID",
                        String.class);

        try {

            if (correlationId != null && !correlationId.isBlank()) {
                MDC.put("correlationId", correlationId);
            }

            PurchasedEvent event = message.getPayload();

            if (processedMessageRepository.existsById(messageId)) {

                log.info(
                        "Purchase message already processed: {}",
                        messageId
                );

                return;
            }

            inventoryService.increaseStock(
                    event.getProductId(),
                    event.getQuantity()
            );

            processedMessageRepository.save(
                    new ProcessedMessage(
                            messageId,
                            LocalDateTime.now()
                    )
            );

            log.info(
                    "Purchase processed. Product: {}, Quantity: {}",
                    event.getProductId(),
                    event.getQuantity()
            );

        } finally {

            MDC.remove("correlationId");
        }
    }
}
