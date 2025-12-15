package com.shadcn.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record LearningModulePowerPointResponse(
        Long id,
        String code,
        String title,
        String duration,
        String shareScope,
        String createdByCompanyName,
        String createdBy,
        Boolean canEdit,
        List<String> intendedAudience,
        List<String> contentTypes,
        String powerPointFilename,
        String powerPointUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
