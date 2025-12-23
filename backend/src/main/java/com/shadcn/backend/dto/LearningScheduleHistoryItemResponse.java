package com.shadcn.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record LearningScheduleHistoryItemResponse(
        Long id,
        Long historyId,
        String agentCode,
        String fullName,
        String phoneNo,
        LocalDate policyLastDate,
        String mediaType,
        String learningCode,
        String waStatus,
        String waMessageId,
        String errorMessage,
        LocalDateTime sentAt,
        LocalDateTime createdAt
) {
}
