
package inventory.inventory.consumer;

import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;

import inventory.inventory.entity.ProcessedMessage;
import inventory.inventory.event.PurchasedEvent;
import inventory.inventory.repository.ProcessedMessageRepository;
import inventory.inventory.service.InventoryService;
import io.awspring.cloud.sqs.listener.SqsHeaders;

class InventoryEventListenerTest {

    private InventoryService inventoryService;
    private ProcessedMessageRepository repository;
    private InventoryEventListener listener;

    @BeforeEach
    void setUp() {
        inventoryService = mock(InventoryService.class);
        repository = mock(ProcessedMessageRepository.class);
        listener = new InventoryEventListener(inventoryService, repository);
    }

    @Test
    void newMessageShouldIncreaseStockAndSaveProcessedMessage() {
        String messageId = "test-message-123";
        PurchasedEvent event = mock(PurchasedEvent.class);

        when(event.getProductId()).thenReturn(2L);
        when(event.getQuantity()).thenReturn(1);
        when(repository.existsById(messageId)).thenReturn(false);

        Message<PurchasedEvent> message = MessageBuilder
                .withPayload(event)
                .setHeader(SqsHeaders.SQS_RAW_MESSAGE_ID_HEADER, messageId)
                .build();

        listener.handlePurchase(message);

        verify(inventoryService).increaseStock(2L, 1);
        verify(repository).save(any(ProcessedMessage.class));
    }

    @Test
    void duplicateMessageShouldNotIncreaseStockAgain() {
        String messageId = "existing-message-123";
        PurchasedEvent event = mock(PurchasedEvent.class);

        when(repository.existsById(messageId)).thenReturn(true);

        Message<PurchasedEvent> message = MessageBuilder
                .withPayload(event)
                .setHeader(SqsHeaders.SQS_RAW_MESSAGE_ID_HEADER, messageId)
                .build();

        listener.handlePurchase(message);

        verify(inventoryService, never()).increaseStock(anyLong(), anyInt());
        verify(repository, never()).save(any(ProcessedMessage.class));
    }
}
