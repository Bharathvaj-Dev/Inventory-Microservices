package inventory.sale.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import inventory.sale.client.InventoryFeignClient;
import inventory.sale.dto.InventoryResponse;

@Component
public class InventoryFeignClientFallbackFactory
        implements FallbackFactory<InventoryFeignClient> {

    private static final Logger log =
            LoggerFactory.getLogger(InventoryFeignClientFallbackFactory.class);

    @Override
    public InventoryFeignClient create(Throwable cause) {

        log.error("Inventory Feign call failed. Cause: ", cause);

        return new InventoryFeignClient() {

            @Override
            public InventoryResponse getInventoryByProductId(Long productId) {

                throw new InventoryServiceUnavailableException(
                        "Inventory service is unavailable. Please try again later.");
            }
        };
    }
}