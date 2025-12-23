package com.shadcn.backend.controller;

import com.shadcn.backend.dto.*;
import com.shadcn.backend.model.LearningScheduleHistory;
import com.shadcn.backend.model.LearningScheduleHistoryItem;
import com.shadcn.backend.repository.LearningScheduleConfigRepository;
import com.shadcn.backend.repository.LearningScheduleHistoryItemRepository;
import com.shadcn.backend.repository.LearningScheduleHistoryRepository;
import com.shadcn.backend.service.LearningScheduleConfigService;
import com.shadcn.backend.service.LearningScheduleAsyncService;
import com.shadcn.backend.service.LearningSchedulePlaceholderService;
import com.shadcn.backend.service.LearningSchedulerExecutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/learning-schedule")
@RequiredArgsConstructor
public class LearningScheduleController {

    private final LearningScheduleConfigService configService;
    private final LearningScheduleConfigRepository configRepository;
    private final LearningScheduleHistoryRepository historyRepository;
    private final LearningScheduleHistoryItemRepository historyItemRepository;
    private final LearningSchedulerExecutionService executionService;
    private final LearningScheduleAsyncService asyncService;
    private final LearningSchedulePlaceholderService placeholderService;

    @Value("${learning.scheduler.default-timezone:Asia/Jakarta}")
    private String defaultTimezone;

    @GetMapping("/types")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<List<String>> listSchedulerTypes() {
        return ResponseEntity.ok(List.of(
                "TRAINING_14_DAY_MICRO_LEARNING",
                "TRAINING_28_DAY_MICRO_LEARNING",
                "WELCOME_NEW_JOINNER",
                "HAPPY_BIRTHDAY_NOTIFICATION",
                "CONGRATULATION",
                "PERFORMANCE_TRACKING_WITH_BALANCE_TO_GO"
        ));
    }

        @GetMapping("/placeholders")
        @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
        public ResponseEntity<LearningSchedulePlaceholdersResponse> getPlaceholders(
            @RequestParam String schedulerType
        ) {
        return ResponseEntity.ok(new LearningSchedulePlaceholdersResponse(
            schedulerType,
            placeholderService.getPlaceholders(schedulerType)
        ));
        }

    @GetMapping("/prerequisites")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<LearningSchedulePrerequisiteResponse> checkPrerequisites(
            @RequestParam String companyCode
    ) {
        return ResponseEntity.ok(configService.checkPrerequisites(companyCode));
    }

    @GetMapping("/configs")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<List<LearningScheduleConfigResponse>> listConfigs(
            @RequestParam String companyCode
    ) {
        return ResponseEntity.ok(configService.listByCompany(companyCode));
    }

    @GetMapping("/configs/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<LearningScheduleConfigResponse> getConfig(
            @RequestParam String companyCode,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(configService.getById(companyCode, id));
    }

    @PostMapping("/configs")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<LearningScheduleConfigResponse> createConfig(
            @RequestParam String companyCode,
            @Valid @RequestBody LearningScheduleConfigRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(configService.create(companyCode, request));
    }

    @PutMapping("/configs/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<LearningScheduleConfigResponse> updateConfig(
            @RequestParam String companyCode,
            @PathVariable Long id,
            @Valid @RequestBody LearningScheduleConfigRequest request
    ) {
        return ResponseEntity.ok(configService.update(companyCode, id, request));
    }

    @PostMapping("/configs/{id}/activate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<LearningScheduleConfigResponse> activate(
            @RequestParam String companyCode,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(configService.activate(companyCode, id));
    }

    @PostMapping("/configs/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<LearningScheduleConfigResponse> deactivate(
            @RequestParam String companyCode,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(configService.deactivate(companyCode, id));
    }

    @PostMapping("/configs/{id}/run")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<LearningScheduleHistoryResponse> runNow(
            @RequestParam String companyCode,
            @PathVariable Long id
    ) {
        var cfg = configRepository.findById(id).orElseThrow(() -> new RuntimeException("Config not found"));
        if (!companyCode.equalsIgnoreCase(cfg.getCompanyCode())) {
            throw new SecurityException("Forbidden");
        }

        configService.validateExecutionPrerequisites(companyCode, cfg.getSchedulerType());

        LearningScheduleHistory h = executionService.executeConfig(cfg);
        return ResponseEntity.ok(toHistoryResponse(h));
    }

    @PostMapping("/configs/{id}/send-now")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<LearningScheduleHistoryResponse> sendNow(
            @RequestParam String companyCode,
            @PathVariable Long id
    ) {
        var cfg = configRepository.findById(id).orElseThrow(() -> new RuntimeException("Config not found"));
        if (!companyCode.equalsIgnoreCase(cfg.getCompanyCode())) {
            throw new SecurityException("Forbidden");
        }

        configService.validateExecutionPrerequisites(companyCode, cfg.getSchedulerType());

        ZoneId zoneId;
        try {
            zoneId = ZoneId.of(defaultTimezone);
        } catch (Exception e) {
            zoneId = ZoneId.of("Asia/Jakarta");
        }

        LocalDate today = ZonedDateTime.now(zoneId).toLocalDate();

        if (cfg.getStartDate() == null || cfg.getEndDate() == null) {
            throw new IllegalArgumentException("Schedule period is not configured");
        }
        if (today.isBefore(cfg.getStartDate()) || today.isAfter(cfg.getEndDate())) {
            throw new IllegalArgumentException("Today is outside configured schedule period");
        }
        if (cfg.getHourOfDay() == null) {
            throw new IllegalArgumentException("Execution hour is not configured");
        }

        cfg.setLastTriggeredAt(LocalDateTime.of(today, LocalTime.of(cfg.getHourOfDay(), 0)));
        configRepository.save(cfg);

        asyncService.executeConfigAsync(id);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(new LearningScheduleHistoryResponse(
            null,
            cfg.getId(),
            cfg.getCompanyCode(),
            String.valueOf(cfg.getSchedulerType()),
            LocalDateTime.now(),
            null,
            "QUEUED",
            0,
            0,
            0,
            0,
            null
        ));
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<Page<LearningScheduleHistoryResponse>> listHistory(
            @RequestParam String companyCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<LearningScheduleHistoryResponse> result = historyRepository
                .findByCompanyCodeOrderByStartedAtDesc(companyCode, pageable)
                .map(this::toHistoryResponse);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/history/{historyId}/items")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<Page<LearningScheduleHistoryItemResponse>> listHistoryItems(
            @RequestParam String companyCode,
            @PathVariable Long historyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        LearningScheduleHistory history = historyRepository.findById(historyId)
                .orElseThrow(() -> new RuntimeException("History not found"));
        if (!companyCode.equalsIgnoreCase(history.getCompanyCode())) {
            throw new SecurityException("Forbidden");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        Page<LearningScheduleHistoryItemResponse> result = historyItemRepository
                .findByHistoryIdOrderByCreatedAtAsc(historyId, pageable)
                .map(this::toHistoryItemResponse);
        return ResponseEntity.ok(result);
    }

    private LearningScheduleHistoryResponse toHistoryResponse(LearningScheduleHistory h) {
        Long cfgId = h.getConfig() == null ? null : h.getConfig().getId();
        return new LearningScheduleHistoryResponse(
                h.getId(),
                cfgId,
                h.getCompanyCode(),
                h.getSchedulerType(),
                h.getStartedAt(),
                h.getFinishedAt(),
                h.getStatus(),
                h.getTotalTargets(),
                h.getSentCount(),
                h.getFailedCount(),
                h.getSkippedCount(),
                h.getErrorMessage()
        );
    }

    private LearningScheduleHistoryItemResponse toHistoryItemResponse(LearningScheduleHistoryItem it) {
        Long historyId = it.getHistory() == null ? null : it.getHistory().getId();
        return new LearningScheduleHistoryItemResponse(
                it.getId(),
                historyId,
                it.getAgentCode(),
                it.getFullName(),
                it.getPhoneNo(),
                it.getPolicyLastDate(),
                it.getMediaType(),
                it.getLearningCode(),
                it.getWaStatus(),
                it.getWaMessageId(),
                it.getErrorMessage(),
                it.getSentAt(),
                it.getCreatedAt()
        );
    }
}
