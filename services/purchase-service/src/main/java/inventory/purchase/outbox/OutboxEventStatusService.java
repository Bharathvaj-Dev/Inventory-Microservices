package inventory.purchase.outbox;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import inventory.purchase.entity.OutboxEvent;
import inventory.purchase.repository.OutboxEventRepository;

@Service
public class OutboxEventStatusService {

    private final OutboxEventRepository repository;

    public OutboxEventStatusService(OutboxEventRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void markAsPublished(OutboxEvent event) {
        event.setPublishedAt(LocalDateTime.now());
        repository.save(event);
    }
}