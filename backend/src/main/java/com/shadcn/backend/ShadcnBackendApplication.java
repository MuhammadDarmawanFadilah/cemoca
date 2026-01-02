package com.shadcn.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableScheduling
@EnableAsync
@EnableCaching
@ComponentScan(basePackages = {"com.shadcn.backend"})
@EnableJpaRepositories(basePackages = {"com.shadcn.backend.repository"})
public class ShadcnBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShadcnBackendApplication.class, args);
    }
}
