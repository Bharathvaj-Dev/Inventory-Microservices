package inventory.sale.config;

import java.net.URI;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import io.awspring.cloud.sqs.operations.SqsTemplate;
import io.awspring.cloud.sqs.support.converter.SqsHeaderMapper;
import io.awspring.cloud.sqs.support.converter.SqsMessagingMessageConverter;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sqs.SqsAsyncClient;

@Configuration
public class SqsConfig {

    @Bean
    public SqsAsyncClient sqsAsyncClient(Environment environment) {

        String endpoint = environment.matchesProfiles("docker")
                ? "http://localstack:4566"
                : "http://localhost:4566";

        return SqsAsyncClient.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.US_EAST_1)
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(
                                        "test",
                                        "test")))
                .build();
    }

    @Bean
    public SqsMessagingMessageConverter sqsMessagingMessageConverter() {

        SqsMessagingMessageConverter converter =
                new SqsMessagingMessageConverter();

        converter.setHeaderMapper(
                new SqsHeaderMapper()
        );

        return converter;
    }

    @Bean
    public SqsTemplate sqsTemplate(
            SqsAsyncClient sqsAsyncClient,
            SqsMessagingMessageConverter converter) {

        return SqsTemplate.builder()
                .sqsAsyncClient(sqsAsyncClient)
                .messageConverter(converter)
                .build();
    }
}
