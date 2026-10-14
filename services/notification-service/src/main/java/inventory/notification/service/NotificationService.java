package inventory.notification.service;

import java.util.List;

import org.springframework.stereotype.Service;

import inventory.notification.entity.Alert;
import inventory.notification.repository.AlertRepository;

@Service
public class NotificationService {

    private final AlertRepository alertRepository;

    public NotificationService(AlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    public List<Alert> getAllNotifications() {
        return alertRepository.findAll();
    }

    public Alert markAsRead(Long id) {

        Alert alert = alertRepository.findById(id)
                .orElseThrow(() ->
                    new RuntimeException(
                        "Notification not found with id: " + id));

        alert.setIsRead(true);

        return alertRepository.save(alert);
    }

    public Alert saveAlert(Alert alert) {
        return alertRepository.save(alert);
    }
}