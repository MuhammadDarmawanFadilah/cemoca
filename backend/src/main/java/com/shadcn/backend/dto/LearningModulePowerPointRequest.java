package com.shadcn.backend.dto;

import java.util.List;

public record LearningModulePowerPointRequest(
        String title,
        String duration,
        String shareScope,
        List<String> intendedAudience,
        List<String> contentTypes,
        String powerPointFilename,
        String powerPointUrl,
        String createdByCompanyName
) {
}
