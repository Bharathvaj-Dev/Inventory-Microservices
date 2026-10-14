package inventory.inventory.config;

import io.awspring.cloud.sqs.support.converter.SqsMessagingMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SqsConfig {

    @Bean
    public SqsMessagingMessageConverter sqsMessagingMessageConverter() {

        SqsMessagingMessageConverter converter =
                new SqsMessagingMessageConverter();

        converter.setHeaderMapper(
                new io.awspring.cloud.sqs.support.converter.SqsHeaderMapper()
        );

        return converter;
    }
}