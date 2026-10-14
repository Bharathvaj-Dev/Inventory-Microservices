package inventory.sale.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import inventory.sale.entity.Sale;
import inventory.sale.service.SaleService;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    private static final Logger log =
            LoggerFactory.getLogger(SaleController.class);

    private final SaleService saleService;

    public SaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    @PostMapping
    public ResponseEntity<String> createSale(
            @RequestBody Sale sale) {

        log.info(
                "Starting sale saga for productId={}, quantity={}",
                sale.getProductId(),
                sale.getQuantity()
        );

        String sagaId = saleService.createSale(sale);

        return ResponseEntity.accepted()
                .body("Sale saga started. Saga ID: " + sagaId);
    }

    @GetMapping
    public ResponseEntity<List<Sale>> getAllSales() {

        log.info("Fetching all sales");

        return ResponseEntity.ok(
                saleService.getAllSales()
        );
    }
}