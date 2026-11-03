package inventory.inventory.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.events.StockInsufficient;
import com.inventory.events.StockReserved;

import inventory.inventory.entity.OutboxEvent;
import inventory.inventory.event.LowStockAlert;
import inventory.inventory.repository.OutboxEventRepository;

import io.awspring.cloud.sqs.operations.SqsTemplate;

@Component
public class OutboxPublisher {

        private final OutboxEventRepository outboxRepository;
        private final SqsTemplate sqsTemplate;
        private final ObjectMapper objectMapper;

        public OutboxPublisher(
                        OutboxEventRepository outboxRepository,
                        SqsTemplate sqsTemplate,
                        ObjectMapper objectMapper) {
                this.outboxRepository = outboxRepository;
                this.sqsTemplate = sqsTemplate;
                this.objectMapper = objectMapper;
        }

        @Scheduled(fixedDelay = 5000)
        public void publishPendingEvents() {
                List<OutboxEvent> events = outboxRepository.findTop20ByPublishedAtIsNullOrderByCreatedAtAsc();

                for (OutboxEvent event : events) {
                        try {
                                publishEvent(event);
                        } catch (Exception e) {
                                System.err.println(
                                                "Outbox publish failed. ID: " + event.getId()
                                                                + ", Type: " + event.getEventType()
                                                                + ", Error: " + e.getMessage());
                        }
                }
        }

        private void publishEvent(OutboxEvent event) throws Exception {
                switch (event.getEventType()) {
                        case "LOW_STOCK_ALERT" -> {
                                LowStockAlert payload = objectMapper.readValue(
                                                event.getPayload(), LowStockAlert.class);

                                payload.setEventId("outbox-" + event.getId());

                                sqsTemplate.send(to -> to.queue("low-stock-alerts")
                                                .payload(payload));
                        }
                        case "STOCK_RESERVED" -> {
                                StockReserved payload = objectMapper.readValue(
                                                event.getPayload(), StockReserved.class);
                                sqsTemplate.send(to -> to.queue("stock-reserved")
                                                .payload(payload));
                        }
                        case "STOCK_INSUFFICIENT" -> {
                                StockInsufficient payload = objectMapper.readValue(
                                                event.getPayload(), StockInsufficient.class);
                                sqsTemplate.send(to -> to.queue("stock-insufficient")
                                                .payload(payload));
                        }
                        default -> throw new IllegalArgumentException(
                                        "Unknown outbox event type: " + event.getEventType());
                }

                markPublished(event.getId());

                System.out.println("Outbox event published. ID: "
                                + event.getId() + ", Type: " + event.getEventType());
        }

        @Transactional
        public void markPublished(Long eventId) {
                OutboxEvent event = outboxRepository.findById(eventId)
                                .orElseThrow(() -> new IllegalStateException(
                                                "Outbox event not found: " + eventId));
                event.setPublishedAt(LocalDateTime.now());
                outboxRepository.save(event);
        }
}