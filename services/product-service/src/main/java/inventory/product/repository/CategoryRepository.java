package inventory.product.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import inventory.product.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {

}