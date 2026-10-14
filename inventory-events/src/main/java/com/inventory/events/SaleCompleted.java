package com.inventory.events;

public class SaleCompleted {

    private String sagaId;
    private Long saleId;
    private Long productId;
    private Integer quantity;

    public SaleCompleted() {
    }

    public SaleCompleted(
            String sagaId,
            Long saleId,
            Long productId,
            Integer quantity) {

        this.sagaId = sagaId;
        this.saleId = saleId;
        this.productId = productId;
        this.quantity = quantity;
    }

    public String getSagaId() {
        return sagaId;
    }

    public void setSagaId(String sagaId) {
        this.sagaId = sagaId;
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
}