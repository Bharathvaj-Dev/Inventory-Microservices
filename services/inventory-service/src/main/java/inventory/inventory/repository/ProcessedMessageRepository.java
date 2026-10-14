package inventory.inventory.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import inventory.inventory.entity.ProcessedMessage;

public interface ProcessedMessageRepository extends JpaRepository<ProcessedMessage, String> {
}