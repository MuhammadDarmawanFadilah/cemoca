package com.shadcn.backend.dto;

import java.time.LocalDate;

public record LearningScheduleMaterialResponse(
        Long id,
        LocalDate startDate,
        LocalDate endDate,
        String learningCode,
        String videoTextTemplate,
        String videoLearningCode1,
        String videoLearningCode2,
        String videoLearningCode3,
        String videoLearningCode4,
        String videoTextTemplate1,
        String videoTextTemplate2,
        String videoTextTemplate3,
        String videoTextTemplate4
) {
}
