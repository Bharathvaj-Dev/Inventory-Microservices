package inventory.inventory.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
    name = "product-service",
    url = "${product.service.url}"
)
public interface ProductFeignClient {

    @GetMapping("/api/products/{id}")
    Object getProductById(@PathVariable("id") Long id);
}