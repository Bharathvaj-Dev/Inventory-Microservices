-- Run once after the product-service starts and Hibernate creates category_name.
-- Preserve existing product categories before switching fully to the static category list.
UPDATE products p
SET category_name = c.name
FROM categories c
WHERE p.category_id = c.id
  AND (p.category_name IS NULL OR p.category_name = '');
