package com.shadcn.backend.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LearningScheduleMaterialRequest(
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotBlank String learningCode,
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
