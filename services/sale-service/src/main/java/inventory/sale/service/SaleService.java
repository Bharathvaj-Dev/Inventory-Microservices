package inventory.sale.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import inventory.sale.entity.Sale;
import inventory.sale.repository.SaleRepository;

import com.inventory.events.StockReservationRequested;

import io.awspring.cloud.sqs.operations.SqsTemplate;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;

@Service
public class SaleService {

    private final SaleRepository saleRepository;
    private final SqsTemplate sqsTemplate;
    private final Counter salesCounter;

    private final String queueName = "stock-reservation-requests";

    public SaleService(
            SaleRepository saleRepository,
            SqsTemplate sqsTemplate,
            MeterRegistry meterRegistry) {

        this.saleRepository = saleRepository;
        this.sqsTemplate = sqsTemplate;

        this.salesCounter = Counter.builder("sales.total")
                .description("Total number of sales")
                .register(meterRegistry);
    }

    public String createSale(Sale sale) {

        String sagaId = UUID.randomUUID().toString();

        StockReservationRequested event =
                new StockReservationRequested(
                        sagaId,
                        sale.getProductId(),
                        sale.getQuantity()
                );

        sqsTemplate.send(to -> to
                .queue(queueName)
                .payload(event)
                .header("X-Saga-ID", sagaId)
        );

        return sagaId;
    }

    public List<Sale> getAllSales() {
        return saleRepository.findAll();
    }
}