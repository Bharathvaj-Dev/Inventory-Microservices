package inventory.inventory.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import inventory.inventory.entity.ProcessedSaga;

public interface ProcessedSagaRepository
        extends JpaRepository<ProcessedSaga, Long> {

    Optional<ProcessedSaga> findBySagaId(String sagaId);
}
