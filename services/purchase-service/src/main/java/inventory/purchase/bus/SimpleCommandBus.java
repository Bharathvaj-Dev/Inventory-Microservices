
package inventory.purchase.bus;

import org.springframework.stereotype.Component;

import inventory.purchase.command.CreatePurchaseCommand;
import inventory.purchase.command.CreatePurchaseCommandHandler;
import inventory.purchase.entity.Purchase;

@Component
public class SimpleCommandBus implements CommandBus {

    private final CreatePurchaseCommandHandler createPurchaseCommandHandler;

    public SimpleCommandBus(
            CreatePurchaseCommandHandler createPurchaseCommandHandler) {

        this.createPurchaseCommandHandler = createPurchaseCommandHandler;
    }

    @Override
    public Purchase dispatch(CreatePurchaseCommand command) {
        return createPurchaseCommandHandler.handle(command);
    }
}
