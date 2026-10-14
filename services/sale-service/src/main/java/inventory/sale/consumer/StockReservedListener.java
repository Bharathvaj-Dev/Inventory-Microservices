package inventory.sale.consumer;

import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

import com.inventory.events.SaleCompleted;
import com.inventory.events.StockReserved;

import inventory.sale.entity.Sale;
import inventory.sale.repository.SaleRepository;

import io.awspring.cloud.sqs.annotation.SqsListener;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;

@Component
public class StockReservedListener {

    private final SaleRepository saleRepository;
    private final SqsTemplate sqsTemplate;
    private final Counter salesCounter;

    public StockReservedListener(
            SaleRepository saleRepository,
            SqsTemplate sqsTemplate,
            MeterRegistry meterRegistry) {

        this.saleRepository = saleRepository;
        this.sqsTemplate = sqsTemplate;

        this.salesCounter = Counter.builder("sales.total")
                .description("Total number of sales")
                .register(meterRegistry);
    }

    @SqsListener("stock-reserved")
    public void handleStockReserved(
            Message<StockReserved> message) {

        StockReserved event = message.getPayload();

        // Idempotency check
        if (saleRepository.findBySagaId(event.getSagaId()).isPresent()) {

            System.out.println(
                    "Duplicate StockReserved event ignored. Saga ID: "
                            + event.getSagaId()
            );

            return;
        }

        Sale sale = new Sale();

        sale.setSagaId(event.getSagaId());
        sale.setProductId(event.getProductId());
        sale.setQuantity(event.getQuantity());
        sale.setSaleDate(java.time.LocalDateTime.now());

        Sale savedSale = saleRepository.save(sale);

        // Increment sales metric only after successful save
        salesCounter.increment();

        // Publish SaleCompleted event
        SaleCompleted completedEvent =
                new SaleCompleted(
                        event.getSagaId(),
                        savedSale.getSaleId(),
                        event.getProductId(),
                        event.getQuantity()
                );

        sqsTemplate.send(to -> to
                .queue("sale-completed")
                .payload(completedEvent));

        System.out.println(
                "Sale completed successfully. Saga ID: "
                        + event.getSagaId()
                        + ", Sale ID: "
                        + savedSale.getSaleId()
        );
    }
}
