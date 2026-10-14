package inventory.inventory.event;

import java.time.LocalDateTime;

public class LowStockAlert {

    private Long productId;
    private Integer currentStock;
    private LocalDateTime timestamp;

    public LowStockAlert() {
    }

    public LowStockAlert(Long productId, Integer currentStock,
                         LocalDateTime timestamp) {
        this.productId = productId;
        this.currentStock = currentStock;
        this.timestamp = timestamp;
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