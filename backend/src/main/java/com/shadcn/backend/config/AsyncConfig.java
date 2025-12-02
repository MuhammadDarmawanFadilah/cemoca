package com.shadcn.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.lang.reflect.Method;
import java.util.concurrent.Executor;

/**
 * Async configuration for handling video generation and WA blast
 * Configured to handle 1000+ concurrent operations
 */
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {
    
    private static final Logger logger = LoggerFactory.getLogger(AsyncConfig.class);
    
    // Core pool size - handles normal workload
    private static final int CORE_POOL_SIZE = 10;
    
    // Max pool size - handles peak workload (1000 videos/messages)
    private static final int MAX_POOL_SIZE = 50;
    
    // Queue capacity - buffer for burst traffic
    private static final int QUEUE_CAPACITY = 500;

    @Bean(name = "taskExecutor")
    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(CORE_POOL_SIZE);
        executor.setMaxPoolSize(MAX_POOL_SIZE);
        executor.setQueueCapacity(QUEUE_CAPACITY);
        executor.setThreadNamePrefix("Async-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        executor.initialize();
        
        logger.info("Async executor configured - Core: {}, Max: {}, Queue: {}", 
            CORE_POOL_SIZE, MAX_POOL_SIZE, QUEUE_CAPACITY);
        
        return executor;
    }
    
    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return new AsyncExceptionHandler();
    }
    
    /**
     * Custom handler for uncaught exceptions in async methods
     */
    private static class AsyncExceptionHandler implements AsyncUncaughtExceptionHandler {
        
        private static final Logger log = LoggerFactory.getLogger(AsyncExceptionHandler.class);
        
        @Override
        public void handleUncaughtException(Throwable ex, Method method, Object... params) {
            log.error("Async exception in method {} with params {}", 
                method.getName(), params, ex);
        }
    }
}
