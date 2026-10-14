package com.inventory.events;

public class StockInsufficient {

    private String sagaId;
    private Long productId;
    private Integer quantity;
    private Integer availableStock;

    public StockInsufficient() {
    }

    public StockInsufficient(String sagaId, Long productId, Integer quantity, Integer availableStock) {
        this.sagaId = sagaId;
        this.productId = productId;
        this.quantity = quantity;
        this.availableStock = availableStock;
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

    public Integer getAvailableStock() {
        return availableStock;
    }

    public void setAvailableStock(Integer availableStock) {
        this.availableStock = availableStock;
    }
}