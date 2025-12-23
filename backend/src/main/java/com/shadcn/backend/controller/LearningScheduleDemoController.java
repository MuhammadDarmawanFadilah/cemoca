package com.shadcn.backend.controller;

import com.shadcn.backend.dto.LearningScheduleDemoSeedRequest;
import com.shadcn.backend.model.LearningScheduleHistory;
import com.shadcn.backend.repository.LearningScheduleConfigRepository;
import com.shadcn.backend.service.LearningScheduleConfigService;
import com.shadcn.backend.service.LearningScheduleDemoDataService;
import com.shadcn.backend.service.LearningSchedulerExecutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/learning-schedule/demo")
@RequiredArgsConstructor
public class LearningScheduleDemoController {

    private final LearningScheduleDemoDataService demoDataService;
    private final LearningScheduleConfigRepository configRepository;
    private final LearningScheduleConfigService configService;
    private final LearningSchedulerExecutionService executionService;

    @PostMapping("/seed")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<Map<String, Object>> seed(@RequestBody LearningScheduleDemoSeedRequest request) {
        return ResponseEntity.ok(demoDataService.seed(request.getCompanyCode(), request.getPhones()));
    }

    @PostMapping("/run-all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<Map<String, Object>> runAll(
            @RequestParam String companyCode,
            @RequestParam(defaultValue = "true") boolean onlyActive
    ) {
        var configs = configRepository.findByCompanyCodeOrderByUpdatedAtDesc(companyCode);
        if (onlyActive) {
            configs = configs.stream().filter(c -> Boolean.TRUE.equals(c.getActive())).toList();
        }

        Map<String, Object> out = new HashMap<>();
        out.put("companyCode", companyCode);
        out.put("onlyActive", onlyActive);
        out.put("configCount", configs.size());

        List<Map<String, Object>> results = configs.stream().map(cfg -> {
            Map<String, Object> r = new HashMap<>();
            r.put("configId", cfg.getId());
            r.put("schedulerType", String.valueOf(cfg.getSchedulerType()));
            r.put("active", cfg.getActive());

            try {
                configService.validateExecutionPrerequisites(companyCode, cfg.getSchedulerType());
                LearningScheduleHistory h = executionService.executeConfig(cfg);
                r.put("historyId", h.getId());
                r.put("status", h.getStatus());
                r.put("totalTargets", h.getTotalTargets());
                r.put("sent", h.getSentCount());
                r.put("failed", h.getFailedCount());
                r.put("skipped", h.getSkippedCount());
            } catch (Exception e) {
                r.put("error", e.getMessage());
            }

            return r;
        }).toList();

        out.put("results", results);
        return ResponseEntity.ok(out);
    }
}
