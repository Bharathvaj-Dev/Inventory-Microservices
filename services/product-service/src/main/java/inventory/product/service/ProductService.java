package inventory.product.service;

import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import inventory.product.entity.Product;
import inventory.product.repository.ProductRepository;

@Service
public class ProductService {

    private static final Set<String> ALLOWED_CATEGORIES = Set.of(
            "Electronics",
            "Computers & Laptops",
            "Mobiles & Accessories",
            "Home Appliances",
            "Clothing",
            "Grocery",
            "Furniture",
            "Sports & Fitness"
    );

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Product not found with id: " + id));
    }

    public Product createProduct(Product product) {
        validateCategory(product.getCategory());
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product product) {
        Product existingProduct = getProductById(id);

        validateCategory(product.getCategory());
        existingProduct.setName(product.getName());
        existingProduct.setDescription(product.getDescription());
        existingProduct.setPrice(product.getPrice());
        existingProduct.setQuantity(product.getQuantity());
        existingProduct.setCategory(product.getCategory());

        return productRepository.save(existingProduct);
    }

    private void validateCategory(String category) {
        if (category != null && !category.isBlank()
                && !ALLOWED_CATEGORIES.contains(category)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid category. Choose one of the supported product categories.");
        }
    }

    public void deleteProduct(Long id) {
        Product existingProduct = getProductById(id);
        productRepository.delete(existingProduct);
    }
}
