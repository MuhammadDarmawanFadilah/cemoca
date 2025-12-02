package com.shadcn.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {
    
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        // Set connection timeout to 10 seconds
        factory.setConnectTimeout(10000);
        // Set read timeout to 30 seconds (for slow APIs like Wablas)
        factory.setReadTimeout(30000);
        
        return new RestTemplate(factory);
    }
}
