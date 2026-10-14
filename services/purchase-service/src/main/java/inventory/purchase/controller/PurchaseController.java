package inventory.purchase.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import inventory.purchase.bus.CommandBus;
import inventory.purchase.bus.QueryBus;
import inventory.purchase.command.CreatePurchaseCommand;
import inventory.purchase.entity.Purchase;
import inventory.purchase.query.GetAllPurchasesQuery;

@RestController
@RequestMapping("/api/purchases")
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
    public ResponseEntity<List<Purchase>> getAllPurchases() {

        return ResponseEntity.ok(
                queryBus.dispatch(new GetAllPurchasesQuery())
        );
    }

    @PostMapping
    public ResponseEntity<Purchase> createPurchase(
            @RequestBody Purchase purchase) {

        CreatePurchaseCommand command =
                new CreatePurchaseCommand(
                        purchase.getProductId(),
                        purchase.getQuantity()
                );

        return ResponseEntity.ok(
                commandBus.dispatch(command)
        );
    }
}
