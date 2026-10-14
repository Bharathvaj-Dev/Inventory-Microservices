package inventory.notification.consumer;

import org.springframework.stereotype.Component;

import inventory.notification.entity.Alert;
import inventory.notification.event.LowStockAlert;
import inventory.notification.service.NotificationService;

import io.awspring.cloud.sqs.annotation.SqsListener;

@Component
public class NotificationEventListener {

    private final NotificationService notificationService;

    public NotificationEventListener(
            NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @SqsListener("low-stock-alerts")
    public void handleLowStockAlert(LowStockAlert event) {

        Alert alert = new Alert(
                event.getProductId(),
                "Low stock alert. Current stock: "
                        + event.getCurrentStock(),
                false,
                event.getTimestamp()
        );

        notificationService.saveAlert(alert);

        System.out.println(
                "Low stock alert received. Product: "
                        + event.getProductId()
                        + ", Stock: "
                        + event.getCurrentStock()
        );
    }
}