package inventory.inventory.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import inventory.inventory.entity.InventoryItem;
import inventory.inventory.service.InventoryService;

@RestController
@RequestMapping("/api/inventory")
@Tag(name = "Inventory", description = "Inventory and stock management APIs")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    @Operation(summary = "Get all inventory", description = "Retrieves all inventory items")
    @ApiResponse(responseCode = "200", description = "Inventory retrieved successfully")
    public ResponseEntity<List<InventoryItem>> getAllInventory() {
        return ResponseEntity.ok(inventoryService.getAllInventory());
    }

    @GetMapping("/{productId}")
    @Operation(summary = "Get inventory by product ID", description = "Retrieves stock details for a specific product")
    @ApiResponse(responseCode = "200", description = "Inventory retrieved successfully")
    @ApiResponse(responseCode = "404", description = "Inventory item not found")
    public ResponseEntity<InventoryItem> getInventoryByProductId(
            @PathVariable Long productId) {

        return ResponseEntity.ok(
                inventoryService.getInventoryByProductId(productId));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Get low-stock items", description = "Retrieves inventory items at or below the specified stock threshold")
    @ApiResponse(responseCode = "200", description = "Low-stock items retrieved successfully")
    @ApiResponse(responseCode = "400", description = "Invalid threshold")
    public ResponseEntity<List<InventoryItem>> getLowStockItems(
            @RequestParam Integer threshold) {

        return ResponseEntity.ok(
                inventoryService.getLowStockItems(threshold));
    }
}