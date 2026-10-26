
package inventory.inventory.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import io.awspring.cloud.sqs.operations.SqsTemplate;

import inventory.inventory.client.ProductFeignClient;
import inventory.inventory.entity.InventoryItem;
import inventory.inventory.event.LowStockAlert;
import inventory.inventory.repository.InventoryItemRepository;

@Service
public class InventoryService {

    private final InventoryItemRepository inventoryItemRepository;

    private final SqsTemplate sqsTemplate;

    private final ProductFeignClient productFeignClient;

    private static final String LOW_STOCK_QUEUE =
            "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/low-stock-alerts";

    public InventoryService(
            InventoryItemRepository inventoryItemRepository,
            SqsTemplate sqsTemplate,
            ProductFeignClient productFeignClient) {

        this.inventoryItemRepository = inventoryItemRepository;
        this.sqsTemplate = sqsTemplate;
        this.productFeignClient = productFeignClient;
    }

    public List<InventoryItem> getAllInventory() {

        return inventoryItemRepository.findAll();

    }


    public InventoryItem getInventoryByProductId(Long productId) {
        InventoryItem item = inventoryItemRepository.findAll()
                .stream()
                .filter(i -> i.getProductId().equals(productId))
                .findFirst()
                .orElseThrow(() ->
                        new RuntimeException(
                                "Inventory not found for productId: "
                                        + productId));

        // Call Product Service for distributed tracing (best-effort, non-blocking)
        try {
            productFeignClient.getProductById(productId);
        } catch (Exception e) {
            System.out.println(
                    "Warning: Could not reach Product Service for tracing (productId: "
                            + productId + "): " + e.getMessage());
        }

        return item;
    }
    public List<InventoryItem> getLowStockItems(Integer threshold) {

        return inventoryItemRepository.findAll()
                .stream()
                .filter(item -> item.getCurrentStock() <= threshold)
                .toList();
    }

    public void increaseStock(Long productId, Integer quantity) {

        InventoryItem item = inventoryItemRepository
                .findAll()
                .stream()
                .filter(i -> i.getProductId().equals(productId))
                .findFirst()
                .orElseThrow(() ->
                        new RuntimeException(
                                "Inventory not found for productId: " + productId));

        item.setCurrentStock(item.getCurrentStock() + quantity);

        item.setLastUpdated(LocalDateTime.now());

        inventoryItemRepository.save(item);

        publishLowStockAlert(item);
    }

    public void decreaseStock(Long productId, Integer quantity) {

        InventoryItem item = inventoryItemRepository
                .findAll()
                .stream()
                .filter(i -> i.getProductId().equals(productId))
                .findFirst()
                .orElseThrow(() ->
                        new RuntimeException(
                                "Inventory not found for productId: " + productId));

        if (item.getCurrentStock() < quantity) {

            throw new RuntimeException(
                    "Insufficient stock for productId: " + productId);
        }

        item.setCurrentStock(item.getCurrentStock() - quantity);

        item.setLastUpdated(LocalDateTime.now());

        inventoryItemRepository.save(item);

        publishLowStockAlert(item);
    }

    private void publishLowStockAlert(InventoryItem item) {

        if (item.getCurrentStock() < 10) {

            LowStockAlert alert = new LowStockAlert(
                    item.getProductId(),
                    item.getCurrentStock(),
                    LocalDateTime.now()
            );

            sqsTemplate.send(
                    LOW_STOCK_QUEUE,
                    alert
            );

            System.out.println(
                    "Low stock alert published. Product: "
                    + item.getProductId()
                    + ", Stock: "
                    + item.getCurrentStock()
            );
        }
    }
}
