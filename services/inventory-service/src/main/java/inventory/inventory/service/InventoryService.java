
package inventory.inventory.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import inventory.inventory.client.ProductFeignClient;
import inventory.inventory.entity.InventoryItem;
import inventory.inventory.entity.OutboxEvent;
import inventory.inventory.event.LowStockAlert;
import inventory.inventory.repository.InventoryItemRepository;
import inventory.inventory.repository.OutboxEventRepository;

@Service
public class InventoryService {

        private final InventoryItemRepository inventoryItemRepository;
        private final OutboxEventRepository outboxEventRepository;
        private final ProductFeignClient productFeignClient;
        private final ObjectMapper objectMapper;

        public InventoryService(
                        InventoryItemRepository inventoryItemRepository,
                        OutboxEventRepository outboxEventRepository,
                        ProductFeignClient productFeignClient,
                        ObjectMapper objectMapper) {

                this.inventoryItemRepository = inventoryItemRepository;
                this.outboxEventRepository = outboxEventRepository;
                this.productFeignClient = productFeignClient;
                this.objectMapper = objectMapper;
        }

        public List<InventoryItem> getAllInventory() {
                return inventoryItemRepository.findAll();
        }

        public InventoryItem getInventoryByProductId(Long productId) {
                InventoryItem item = inventoryItemRepository.findAll()
                                .stream()
                                .filter(i -> i.getProductId().equals(productId))
                                .findFirst()
                                .orElseThrow(() -> new RuntimeException(
                                                "Inventory not found for productId: " + productId));

                // Best-effort Product Service call
                try {
                        productFeignClient.getProductById(productId);
                } catch (Exception e) {
                        System.out.println(
                                        "Warning: Could not reach Product Service for tracing: "
                                                        + e.getMessage());
                }

                return item;
        }

        public List<InventoryItem> getLowStockItems(Integer threshold) {
                return inventoryItemRepository.findAll()
                                .stream()
                                .filter(item -> item.getCurrentStock() <= threshold)
                                .toList();
        }

        @Transactional
        public void increaseStock(Long productId, Integer quantity) {
                InventoryItem item = findInventoryItem(productId);

                item.setCurrentStock(item.getCurrentStock() + quantity);
                item.setLastUpdated(LocalDateTime.now());

                inventoryItemRepository.save(item);
                saveLowStockOutboxEvent(item);
        }

        @Transactional
        public void decreaseStock(Long productId, Integer quantity) {
                InventoryItem item = findInventoryItem(productId);

                if (item.getCurrentStock() < quantity) {
                        throw new RuntimeException(
                                        "Insufficient stock for productId: " + productId);
                }

                item.setCurrentStock(item.getCurrentStock() - quantity);
                item.setLastUpdated(LocalDateTime.now());

                inventoryItemRepository.save(item);
                saveLowStockOutboxEvent(item);
        }

        private InventoryItem findInventoryItem(Long productId) {
                return inventoryItemRepository.findAll()
                                .stream()
                                .filter(i -> i.getProductId().equals(productId))
                                .findFirst()
                                .orElseThrow(() -> new RuntimeException(
                                                "Inventory not found for productId: " + productId));
        }

        private void saveLowStockOutboxEvent(InventoryItem item) {
                if (item.getCurrentStock() < 10) {
                        LowStockAlert alert = new LowStockAlert(
                                        null,
                                        item.getProductId(),
                                        item.getCurrentStock(),
                                        LocalDateTime.now());

                        try {
                                String payload = objectMapper.writeValueAsString(alert);

                                OutboxEvent event = new OutboxEvent(
                                                "LOW_STOCK_ALERT",
                                                payload);

                                outboxEventRepository.save(event);

                                System.out.println(
                                                "Low-stock event saved to outbox. Product: "
                                                                + item.getProductId()
                                                                + ", Stock: " + item.getCurrentStock());
                        } catch (JsonProcessingException e) {
                                throw new IllegalStateException(
                                                "Failed to serialize low-stock alert", e);
                        }
                }
        }
}
