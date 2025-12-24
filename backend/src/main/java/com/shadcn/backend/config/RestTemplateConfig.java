package com.shadcn.backend.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    @Value("${app.http.connect-timeout-ms}")
    private int connectTimeoutMs;

    @Value("${app.http.read-timeout-ms}")
    private int readTimeoutMs;

    @PostConstruct
    void validateTimeouts() {
        if (connectTimeoutMs <= 0) {
            throw new IllegalStateException("Invalid property app.http.connect-timeout-ms; must be > 0");
        }
        if (readTimeoutMs <= 0) {
            throw new IllegalStateException("Invalid property app.http.read-timeout-ms; must be > 0");
        }
    }
    
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeoutMs);
        factory.setReadTimeout(readTimeoutMs);
        
        return new RestTemplate(factory);
    }
}
