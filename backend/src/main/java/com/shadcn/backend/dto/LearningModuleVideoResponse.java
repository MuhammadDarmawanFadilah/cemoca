package com.shadcn.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record LearningModuleVideoResponse(
        Long id,
        String code,
        String videoCategory,
        String title,
        String duration,
        String shareScope,
        String createdByCompanyName,
        String createdBy,
        Boolean canEdit,
        List<String> intendedAudience,
        List<String> contentTypes,
        String text,
        String textPreview,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
