package inventory.sale.event;

import java.time.LocalDateTime;

public class SaleCreated {

    private Long saleId;
    private Long productId;
    private Integer quantity;
    private LocalDateTime saleDate;

    public SaleCreated() {
    }

    public SaleCreated(
            Long saleId,
            Long productId,
            Integer quantity,
            LocalDateTime saleDate) {

        this.saleId = saleId;
        this.productId = productId;
        this.quantity = quantity;
        this.saleDate = saleDate;
    }

    public Long getSaleId() {
        return saleId;
    }

    public void setSaleId(Long saleId) {
        this.saleId = saleId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public LocalDateTime getSaleDate() {
        return saleDate;
    }

    public void setSaleDate(LocalDateTime saleDate) {
        this.saleDate = saleDate;
    }
}