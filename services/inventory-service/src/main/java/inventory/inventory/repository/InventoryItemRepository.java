package inventory.inventory.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import inventory.inventory.entity.InventoryItem;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    Optional<InventoryItem> findByProductId(Long productId);

}