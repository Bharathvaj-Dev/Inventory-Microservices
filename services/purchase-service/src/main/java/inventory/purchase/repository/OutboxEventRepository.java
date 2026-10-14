package inventory.purchase.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import inventory.purchase.entity.OutboxEvent;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {

    List<OutboxEvent> findTop20ByPublishedAtIsNullOrderByCreatedAtAsc();
}