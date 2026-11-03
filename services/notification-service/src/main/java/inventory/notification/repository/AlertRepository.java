
package inventory.notification.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import inventory.notification.entity.Alert;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    Optional<Alert> findByEventId(String eventId);
}
