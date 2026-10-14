package inventory.product.health;

import java.util.concurrent.TimeUnit;

import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

import software.amazon.awssdk.services.sqs.SqsAsyncClient;

@Component("sqs")
public class SqsHealthIndicator implements HealthIndicator {

    private final SqsAsyncClient sqsAsyncClient;

    public SqsHealthIndicator(SqsAsyncClient sqsAsyncClient) {
        this.sqsAsyncClient = sqsAsyncClient;
    }

    @Override
    public Health health() {
        try {
            var response = sqsAsyncClient.listQueues()
                    .get(3, TimeUnit.SECONDS);

            int queueCount = response.queueUrls() == null
                    ? 0
                    : response.queueUrls().size();

            return Health.up()
                    .withDetail("service", "LocalStack SQS")
                    .withDetail("queueCount", queueCount)
                    .build();

        } catch (Exception e) {
            return Health.down()
                    .withDetail("service", "LocalStack SQS")
                    .withException(e)
                    .build();
        }
    }
}