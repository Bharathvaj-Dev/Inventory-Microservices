package inventory.inventory.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    @Operation(summary = "Get all inventory")
    @ApiResponse(responseCode = "200", description = "Inventory retrieved successfully")
    public ResponseEntity<List<InventoryItem>> getAllInventory() {
        return ResponseEntity.ok(inventoryService.getAllInventory());
    }

    @GetMapping("/{productId}")
    @Operation(summary = "Get inventory by product ID")
    @ApiResponse(responseCode = "200", description = "Inventory retrieved successfully")
    @ApiResponse(responseCode = "404", description = "Inventory item not found")
    public ResponseEntity<InventoryItem> getInventoryByProductId(@PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getInventoryByProductId(productId));
    }

    @PostMapping
    @Operation(summary = "Create inventory item")
    @ApiResponse(responseCode = "201", description = "Inventory item created")
    public ResponseEntity<InventoryItem> createInventory(@RequestBody InventoryItem item) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.createInventory(item));
    }

    @PutMapping("/{productId}")
    @Operation(summary = "Update inventory stock")
    @ApiResponse(responseCode = "200", description = "Inventory item updated")
    public ResponseEntity<InventoryItem> updateInventory(
            @PathVariable Long productId, @RequestBody InventoryItem item) {
        return ResponseEntity.ok(inventoryService.updateInventory(productId, item));
    }

    @DeleteMapping("/{productId}")
    @Operation(summary = "Delete inventory item")
    @ApiResponse(responseCode = "204", description = "Inventory item deleted")
    public ResponseEntity<Void> deleteInventory(@PathVariable Long productId) {
        inventoryService.deleteInventory(productId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Get low-stock items")
    @ApiResponse(responseCode = "200", description = "Low-stock items retrieved successfully")
    public ResponseEntity<List<InventoryItem>> getLowStockItems(@RequestParam Integer threshold) {
        return ResponseEntity.ok(inventoryService.getLowStockItems(threshold));
    }
}