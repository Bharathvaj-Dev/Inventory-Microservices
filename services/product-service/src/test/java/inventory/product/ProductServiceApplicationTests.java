
package inventory.product;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(
    classes = ProductServiceApplication.class,
    properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:5433/product_db",
        "spring.datasource.username=postgres",
        "spring.datasource.password=postgres",
        "spring.datasource.driver-class-name=org.postgresql.Driver"
    }
)
class ProductServiceApplicationTests {

    @Test
    void contextLoads() {
    }
}
