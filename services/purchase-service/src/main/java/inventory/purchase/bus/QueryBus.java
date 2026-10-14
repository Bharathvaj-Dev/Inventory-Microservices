package inventory.purchase.bus;

import java.util.List;

import inventory.purchase.entity.Purchase;
import inventory.purchase.query.GetAllPurchasesQuery;

public interface QueryBus {

    List<Purchase> dispatch(GetAllPurchasesQuery query);
}
