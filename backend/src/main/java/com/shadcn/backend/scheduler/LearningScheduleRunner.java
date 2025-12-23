package com.shadcn.backend.scheduler;

import com.shadcn.backend.model.LearningScheduleConfig;
import com.shadcn.backend.repository.LearningScheduleConfigRepository;
import com.shadcn.backend.service.LearningScheduleAsyncService;
import com.shadcn.backend.service.LearningScheduleConfigService;
import com.shadcn.backend.service.SchedulerLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LearningScheduleRunner {

    private final LearningScheduleConfigRepository configRepository;
    private final LearningScheduleAsyncService asyncService;
    private final LearningScheduleConfigService configService;
    private final SchedulerLogService schedulerLogService;

    @Value("${learning.scheduler.enabled:false}")
    private boolean enabled;

    @Value("${learning.scheduler.default-timezone:Asia/Jakarta}")
    private String defaultTimezone;

    @Scheduled(
            fixedDelayString = "${learning.scheduler.poll-interval-ms:3600000}",
            initialDelayString = "${learning.scheduler.initial-delay-ms:60000}"
    )
    @Transactional
    public void pollAndExecute() {
        if (!enabled) {
            return;
        }

        List<LearningScheduleConfig> configs = configRepository.findByActiveTrue();
        if (configs.isEmpty()) {
            return;
        }

        ZoneId zoneId;
        try {
            zoneId = ZoneId.of(defaultTimezone);
        } catch (Exception e) {
            zoneId = ZoneId.of("Asia/Jakarta");
        }

        ZonedDateTime now = ZonedDateTime.now(zoneId);

        for (LearningScheduleConfig cfg : configs) {
            try {
                if (!isDue(cfg, now.toLocalDate(), now.getHour())) {
                    continue;
                }

                configService.validateExecutionPrerequisites(cfg.getCompanyCode(), cfg.getSchedulerType());

                cfg.setLastTriggeredAt(now.toLocalDateTime());
                configRepository.save(cfg);

                log.info("[LEARNING SCHEDULER] Due configId={} companyCode={} type={} at {}", cfg.getId(), cfg.getCompanyCode(), cfg.getSchedulerType(), now);
                schedulerLogService.info(
                        "SCHEDULER_DUE",
                        cfg,
                        null,
                        "Due and enqueued at " + now
                );

                asyncService.executeConfigAsync(cfg.getId());

            } catch (Exception e) {
                log.error("[LEARNING SCHEDULER] Error executing config {}: {}", cfg.getId(), e.getMessage(), e);
                schedulerLogService.error(
                        "SCHEDULER_ERROR",
                        cfg,
                        null,
                        "Scheduler loop error: " + (e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage()),
                        e
                );
            }
        }
    }

    private boolean isDue(LearningScheduleConfig cfg, LocalDate today, int hour) {
        if (!Boolean.TRUE.equals(cfg.getActive())) {
            return false;
        }
        if (cfg.getStartDate() == null || cfg.getEndDate() == null) {
            return false;
        }
        if (today.isBefore(cfg.getStartDate()) || today.isAfter(cfg.getEndDate())) {
            return false;
        }
        if (cfg.getHourOfDay() == null || cfg.getHourOfDay() != hour) {
            return false;
        }

        LocalDateTime last = cfg.getLastTriggeredAt();
        if (last == null) {
            return true;
        }

        return !(last.toLocalDate().equals(today) && last.getHour() == hour);
    }
}
