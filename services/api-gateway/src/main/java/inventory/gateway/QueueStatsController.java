
package inventory.gateway;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Mono;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sqs.SqsAsyncClient;
import software.amazon.awssdk.services.sqs.model.GetQueueAttributesRequest;
import software.amazon.awssdk.services.sqs.model.QueueAttributeName;

@RestController
@RequestMapping("/api/admin")
public class QueueStatsController {

    private final SqsAsyncClient sqs;

    public QueueStatsController(
            @Value("${aws.sqs.endpoint:http://localhost:4566}") String endpoint,
            @Value("${aws.sqs.region:us-east-1}") String region,
            @Value("${aws.sqs.access-key:test}") String accessKey,
            @Value("${aws.sqs.secret-key:test}") String secretKey) {

        this.sqs = SqsAsyncClient.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(accessKey, secretKey)))
                .build();
    }

    @GetMapping("/queue-stats")
    public Mono<Map<String, Object>> getQueueStats() {
        return Mono.fromFuture(sqs.listQueues())
                .flatMap(response -> {
                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("queueCount", response.queueUrls().size());

                    CompletableFuture<?>[] futures = response.queueUrls()
                            .stream()
                            .map(url -> {
                                String queueName =
                                        url.substring(url.lastIndexOf('/') + 1);

                                return sqs.getQueueAttributes(
                                        GetQueueAttributesRequest.builder()
                                                .queueUrl(url)
                                                .attributeNames(
                                                        QueueAttributeName.APPROXIMATE_NUMBER_OF_MESSAGES,
                                                        QueueAttributeName.APPROXIMATE_NUMBER_OF_MESSAGES_NOT_VISIBLE,
                                                        QueueAttributeName.APPROXIMATE_NUMBER_OF_MESSAGES_DELAYED)
                                                .build())
                                        .thenAccept(attributes -> {
                                            Map<String, Object> stats =
                                                    new LinkedHashMap<>();

                                            stats.put("messages",
                                                    attributes.attributes().getOrDefault(
                                                            QueueAttributeName.APPROXIMATE_NUMBER_OF_MESSAGES,
                                                            "0"));
                                            stats.put("inFlight",
                                                    attributes.attributes().getOrDefault(
                                                            QueueAttributeName.APPROXIMATE_NUMBER_OF_MESSAGES_NOT_VISIBLE,
                                                            "0"));
                                            stats.put("delayed",
                                                    attributes.attributes().getOrDefault(
                                                            QueueAttributeName.APPROXIMATE_NUMBER_OF_MESSAGES_DELAYED,
                                                            "0"));

                                            synchronized (result) {
                                                result.put(queueName, stats);
                                            }
                                        });
                            })
                            .toArray(CompletableFuture[]::new);

                    return Mono.fromFuture(CompletableFuture.allOf(futures))
                            .thenReturn(result);
                });
    }
}
