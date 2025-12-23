package com.shadcn.backend.dto;

public record LearningSchedulePrerequisiteResponse(
        boolean agencyListExists,
        boolean policySalesExists
) {
}
