package com.shadcn.backend.service;

import com.shadcn.backend.repository.LearningScheduleConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class LearningScheduleAsyncService {

    private final LearningScheduleConfigRepository configRepository;
    private final LearningSchedulerExecutionService executionService;
    private final SchedulerLogService schedulerLogService;

    @Async("taskExecutor")
    public void executeConfigAsync(Long configId) {
        com.shadcn.backend.model.LearningScheduleConfig cfg = null;
        try {
            cfg = configRepository.findById(configId)
                    .orElseThrow(() -> new RuntimeException("Config not found"));

            schedulerLogService.info(
                    "ASYNC_START",
                    cfg,
                    null,
                    "Async execution started"
            );

            executionService.executeConfig(cfg);
        } catch (Exception e) {
            log.error("Async execute config failed for configId={}: {}", configId, e.getMessage(), e);
            schedulerLogService.error(
                    "ASYNC_ERROR",
                    cfg,
                    null,
                    "Async execution failed: " + (e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage()),
                    e
            );
        }
    }
}
