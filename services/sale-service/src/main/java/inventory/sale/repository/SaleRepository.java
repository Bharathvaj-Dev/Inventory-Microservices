package inventory.sale.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import inventory.sale.entity.Sale;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    Optional<Sale> findBySagaId(String sagaId);

}