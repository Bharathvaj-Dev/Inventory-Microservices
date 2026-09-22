package com.inventory.events;

public class ProductEvent {

    private String eventType;
    private Long productId;
    private String productName;

    public ProductEvent() {
    }

    public ProductEvent(String eventType, Long productId, String productName) {
        this.eventType = eventType;
        this.productId = productId;
        this.productName = productName;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }
}