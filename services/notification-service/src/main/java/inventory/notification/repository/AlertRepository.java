package inventory.notification.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import inventory.notification.entity.Alert;

public interface AlertRepository extends JpaRepository<Alert, Long> {
}