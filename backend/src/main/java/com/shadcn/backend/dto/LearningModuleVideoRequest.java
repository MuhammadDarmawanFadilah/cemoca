package com.shadcn.backend.dto;

import java.util.List;

public record LearningModuleVideoRequest(
        String title,
        String duration,
        String shareScope,
        List<String> intendedAudience,
        List<String> contentTypes,
        String text,
        String createdByCompanyName
) {
}
