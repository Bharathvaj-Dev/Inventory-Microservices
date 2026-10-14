package inventory.purchase.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import inventory.purchase.entity.Purchase;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

}