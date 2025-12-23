package com.shadcn.backend.dto;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LearningScheduleConfigRequest(
        @NotBlank String schedulerType,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotNull @Min(0) @Max(23) Integer hourOfDay,
        @NotBlank String mediaType,
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
        List<@Valid LearningScheduleMaterialRequest> materials,
        @NotBlank String waMessageTemplate,
        String didPresenterId,
        String didPresenterName,
        Boolean active
) {
}
