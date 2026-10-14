package inventory.purchase.query;

import java.util.List;

import org.springframework.stereotype.Component;

import inventory.purchase.entity.Purchase;
import inventory.purchase.repository.PurchaseRepository;

@Component
public class GetAllPurchasesQueryHandler {

    private final PurchaseRepository purchaseRepository;

    public GetAllPurchasesQueryHandler(
            PurchaseRepository purchaseRepository) {

        this.purchaseRepository = purchaseRepository;
    }

    public List<Purchase> handle(GetAllPurchasesQuery query) {
        return purchaseRepository.findAll();
    }
}
