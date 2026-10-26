package inventory.purchase.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import inventory.purchase.bus.CommandBus;
import inventory.purchase.bus.QueryBus;
import inventory.purchase.command.CreatePurchaseCommand;
import inventory.purchase.entity.Purchase;
import inventory.purchase.query.GetAllPurchasesQuery;

@RestController
@RequestMapping("/api/purchases")
@Tag(name = "Purchases", description = "Purchase and stock replenishment APIs")
public class PurchaseController {

        private final CommandBus commandBus;
        private final QueryBus queryBus;

        public PurchaseController(
                        CommandBus commandBus,
                        QueryBus queryBus) {

                this.commandBus = commandBus;
                this.queryBus = queryBus;
        }

        @GetMapping
        @Operation(summary = "Get all purchases", description = "Retrieves all purchase records")
        @ApiResponse(responseCode = "200", description = "Purchases retrieved successfully")
        public ResponseEntity<List<Purchase>> getAllPurchases() {

                return ResponseEntity.ok(
                                queryBus.dispatch(new GetAllPurchasesQuery()));
        }

        @PostMapping
        @Operation(summary = "Create purchase", description = "Creates a purchase request for a product and quantity")
        @ApiResponse(responseCode = "200", description = "Purchase request processed successfully")
        @ApiResponse(responseCode = "400", description = "Invalid purchase data")
        public ResponseEntity<Purchase> createPurchase(
                        @RequestBody Purchase purchase) {

                CreatePurchaseCommand command = new CreatePurchaseCommand(
                                purchase.getProductId(),
                                purchase.getQuantity());

                return ResponseEntity.ok(
                                commandBus.dispatch(command));
        }
}