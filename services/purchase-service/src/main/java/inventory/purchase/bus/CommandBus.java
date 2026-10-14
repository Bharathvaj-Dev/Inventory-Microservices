package inventory.purchase.bus;

import inventory.purchase.command.CreatePurchaseCommand;
import inventory.purchase.entity.Purchase;

public interface CommandBus {

    Purchase dispatch(CreatePurchaseCommand command);
}
