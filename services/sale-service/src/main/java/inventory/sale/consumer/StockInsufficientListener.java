package inventory.sale.consumer;

import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

import com.inventory.events.SaleFailed;
import com.inventory.events.StockInsufficient;

import io.awspring.cloud.sqs.annotation.SqsListener;
import io.awspring.cloud.sqs.operations.SqsTemplate;

@Component
public class StockInsufficientListener {

    private final SqsTemplate sqsTemplate;

    public StockInsufficientListener(SqsTemplate sqsTemplate) {
        this.sqsTemplate = sqsTemplate;
    }

    @SqsListener("stock-insufficient")
    public void handleStockInsufficient(
            Message<StockInsufficient> message) {

        StockInsufficient event = message.getPayload();

        SaleFailed failedEvent =
                new SaleFailed(
                        event.getSagaId(),
                        event.getProductId(),
                        event.getQuantity(),
                        event.getAvailableStock()
                );

        sqsTemplate.send(to -> to
                .queue("sale-failed")
                .payload(failedEvent));

        System.out.println(
                "Sale failed due to insufficient stock. Saga ID: "
                        + event.getSagaId()
                        + ", Product ID: "
                        + event.getProductId()
                        + ", Requested: "
                        + event.getQuantity()
                        + ", Available: "
                        + event.getAvailableStock()
        );
    }
}
