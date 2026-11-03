package inventory.gateway.filter;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Mono;

@Component
public class CorrelationIdGlobalFilter implements GlobalFilter, Ordered {

        private static final Logger log = LoggerFactory.getLogger(CorrelationIdGlobalFilter.class);

        private static final String CORRELATION_ID = "X-Correlation-ID";

        @Override
        public Mono<Void> filter(
                        ServerWebExchange exchange,
                        GatewayFilterChain chain) {

                String correlationId = exchange.getRequest()
                                .getHeaders()
                                .getFirst(CORRELATION_ID);

                if (correlationId == null || correlationId.isBlank()) {
                        correlationId = UUID.randomUUID().toString();
                }

                final String requestCorrelationId = correlationId;

                ServerHttpRequest request = exchange.getRequest()
                                .mutate()
                                .headers(headers -> headers.set(CORRELATION_ID, requestCorrelationId))
                                .build();

                ServerWebExchange mutatedExchange = exchange.mutate()
                                .request(request)
                                .build();

                mutatedExchange.getResponse().beforeCommit(() -> {
                        mutatedExchange.getResponse()
                                        .getHeaders()
                                        .set(CORRELATION_ID, requestCorrelationId);
                        return Mono.empty();
                });

                log.info(
                                "Incoming request: method={}, path={}, correlationId={}",
                                exchange.getRequest().getMethod(),
                                exchange.getRequest().getURI().getPath(),
                                requestCorrelationId);

                return chain.filter(mutatedExchange);
        }

        @Override
        public int getOrder() {
                return -100;
        }
}
