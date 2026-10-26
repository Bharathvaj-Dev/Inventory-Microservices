package inventory.sale.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import inventory.sale.entity.Sale;
import inventory.sale.service.SaleService;

@RestController
@RequestMapping("/api/sales")
@Tag(name = "Sales", description = "Sales processing and saga APIs")
public class SaleController {

        private static final Logger log = LoggerFactory.getLogger(SaleController.class);

        private final SaleService saleService;

        public SaleController(SaleService saleService) {
                this.saleService = saleService;
        }

        @PostMapping
        @Operation(summary = "Create sale", description = "Starts a sale saga for the requested product and quantity")
        @ApiResponse(responseCode = "202", description = "Sale saga accepted and started")
        @ApiResponse(responseCode = "400", description = "Invalid sale data")
        public ResponseEntity<String> createSale(
                        @RequestBody Sale sale) {

                log.info(
                                "Starting sale saga for productId={}, quantity={}",
                                sale.getProductId(),
                                sale.getQuantity());

                String sagaId = saleService.createSale(sale);

                return ResponseEntity.accepted()
                                .body("Sale saga started. Saga ID: " + sagaId);
        }

        @GetMapping
        @Operation(summary = "Get all sales", description = "Retrieves all sale records")
        @ApiResponse(responseCode = "200", description = "Sales retrieved successfully")
        public ResponseEntity<List<Sale>> getAllSales() {

                log.info("Fetching all sales");

                return ResponseEntity.ok(
                                saleService.getAllSales());
        }
}