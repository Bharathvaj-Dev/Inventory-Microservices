package com.inventory.events;

public class StockReserved {

    private String sagaId;
    private Long productId;
    private Integer quantity;

    public StockReserved() {
    }

    public StockReserved(String sagaId, Long productId, Integer quantity) {
        this.sagaId = sagaId;
        this.productId = productId;
        this.quantity = quantity;
    }

    public String getSagaId() {
        return sagaId;
    }

    public void setSagaId(String sagaId) {
        this.sagaId = sagaId;
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