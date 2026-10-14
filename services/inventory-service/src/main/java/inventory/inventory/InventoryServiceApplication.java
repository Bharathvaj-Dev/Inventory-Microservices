package inventory.inventory;

import java.time.LocalDateTime;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;

import inventory.inventory.entity.InventoryItem;
import inventory.inventory.repository.InventoryItemRepository;

@SpringBootApplication
@EnableFeignClients
public class InventoryServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(InventoryServiceApplication.class, args);
    }

    @Bean
    CommandLineRunner seedInventory(InventoryItemRepository repository) {
        return args -> {

            if (repository.count() == 0) {

                repository.save(new InventoryItem(
                        1L, 25, LocalDateTime.now()));

                repository.save(new InventoryItem(
                        2L, 8, LocalDateTime.now()));

                repository.save(new InventoryItem(
                        3L, 15, LocalDateTime.now()));

                repository.save(new InventoryItem(
                        4L, 5, LocalDateTime.now()));

                repository.save(new InventoryItem(
                        5L, 30, LocalDateTime.now()));

                repository.save(new InventoryItem(
                        6L, 12, LocalDateTime.now()));

                repository.save(new InventoryItem(
                        7L, 3, LocalDateTime.now()));

                repository.save(new InventoryItem(
                        8L, 20, LocalDateTime.now()));

                repository.save(new InventoryItem(
                        9L, 7, LocalDateTime.now()));

                repository.save(new InventoryItem(
                        10L, 50, LocalDateTime.now()));
            }
        };
    }
}