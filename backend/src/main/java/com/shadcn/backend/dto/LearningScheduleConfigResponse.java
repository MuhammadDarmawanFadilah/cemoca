package com.shadcn.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record LearningScheduleConfigResponse(
        Long id,
        String companyCode,
        String schedulerType,
        Boolean active,
        LocalDate startDate,
        LocalDate endDate,
        Integer hourOfDay,
        String mediaType,
        String learningCode,
        String videoLearningCode1,
        String videoLearningCode2,
        String videoLearningCode3,
        String videoLearningCode4,
        String videoTextTemplate,
        String videoTextTemplate1,
        String videoTextTemplate2,
        String videoTextTemplate3,
        String videoTextTemplate4,
        List<LearningScheduleMaterialResponse> materials,
        String waMessageTemplate,
        String didPresenterId,
        String didPresenterName,
        LocalDateTime lastTriggeredAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
