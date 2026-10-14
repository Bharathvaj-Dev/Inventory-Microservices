package inventory.purchase.outbox;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import inventory.purchase.entity.OutboxEvent;
import inventory.purchase.repository.OutboxEventRepository;
import io.awspring.cloud.sqs.operations.SqsTemplate;

@Component
public class OutboxWorker {

    private static final Logger log =
            LoggerFactory.getLogger(OutboxWorker.class);

    private final OutboxEventRepository outboxEventRepository;
    private final SqsTemplate sqsTemplate;

    public OutboxWorker(
            OutboxEventRepository outboxEventRepository,
            SqsTemplate sqsTemplate) {

        this.outboxEventRepository = outboxEventRepository;
        this.sqsTemplate = sqsTemplate;
    }

    @Scheduled(fixedDelay = 2000)
    public void publishUnpublishedEvents() {

        List<OutboxEvent> events =
                outboxEventRepository
                    .findTop20ByPublishedAtIsNullOrderByCreatedAtAsc();

        // DEBUG: Check pending event count
        log.info("Unpublished outbox events count={}", events.size());

        for (OutboxEvent event : events) {
            try {
                // DEBUG: Before sending to SQS
                log.info(
                    "Publishing event id={} type={} to purchase-events",
                    event.getId(),
                    event.getEventType()
                );

                sqsTemplate.send(to -> to
                        .queue("purchase-events")
                        .payload(event.getPayload()));

                // Mark published only after send succeeds
                markAsPublished(event);

                log.info(
                    "Outbox event published successfully. id={}, type={}",
                    event.getId(),
                    event.getEventType()
                );

            } catch (Exception e) {
                log.error(
                    "Failed to publish outbox event. id={}. Will retry.",
                    event.getId(),
                    e
                );
            }
        }
    }

    @Transactional
    public void markAsPublished(OutboxEvent event) {
        event.setPublishedAt(LocalDateTime.now());
        outboxEventRepository.save(event);
    }
}
