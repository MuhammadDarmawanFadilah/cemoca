package com.shadcn.backend.dto;

import java.time.LocalDateTime;

public record LearningScheduleHistoryResponse(
        Long id,
        Long configId,
        String companyCode,
        String schedulerType,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        String status,
        Integer totalTargets,
        Integer sentCount,
        Integer failedCount,
        Integer skippedCount,
        String errorMessage
) {
}
