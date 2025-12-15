package com.shadcn.backend.dto;

import java.util.List;

public record LearningModuleImageRequest(
        String title,
        String duration,
        String shareScope,
        List<String> intendedAudience,
        List<String> contentTypes,
        String imageFilename,
        String imageUrl,
        String createdByCompanyName
) {
}
