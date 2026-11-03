
package inventory.notification.event;

import java.time.LocalDateTime;

public class LowStockAlert {

    private String eventId;
    private Long productId;
    private Integer currentStock;
    private LocalDateTime timestamp;

    public LowStockAlert() {
    }

    public LowStockAlert(String eventId, Long productId,
                         Integer currentStock,
                         LocalDateTime timestamp) {
        this.eventId = eventId;
        this.productId = productId;
        this.currentStock = currentStock;
        this.timestamp = timestamp;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Integer getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(Integer currentStock) {
        this.currentStock = currentStock;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
