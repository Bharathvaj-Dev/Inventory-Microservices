package inventory.sale.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import inventory.sale.dto.InventoryResponse;
import inventory.sale.exception.InventoryFeignClientFallbackFactory;

@FeignClient(
	    name = "inventory-service",
	    url = "${inventory.service.url}",
	    fallbackFactory = InventoryFeignClientFallbackFactory.class
	)
public interface InventoryFeignClient {

    @GetMapping("/api/inventory/{productId}")
    InventoryResponse getInventoryByProductId(
            @PathVariable("productId") Long productId);
}