package inventory.purchase.bus;

import java.util.List;

import org.springframework.stereotype.Component;

import inventory.purchase.entity.Purchase;
import inventory.purchase.query.GetAllPurchasesQuery;
import inventory.purchase.query.GetAllPurchasesQueryHandler;

@Component
public class SimpleQueryBus implements QueryBus {

    private final GetAllPurchasesQueryHandler getAllPurchasesQueryHandler;

    public SimpleQueryBus(
            GetAllPurchasesQueryHandler getAllPurchasesQueryHandler) {

        this.getAllPurchasesQueryHandler = getAllPurchasesQueryHandler;
    }

    @Override
    public List<Purchase> dispatch(GetAllPurchasesQuery query) {
        return getAllPurchasesQueryHandler.handle(query);
    }
}
