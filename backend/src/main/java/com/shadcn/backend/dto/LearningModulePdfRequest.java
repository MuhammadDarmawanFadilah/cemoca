package com.shadcn.backend.dto;

import java.util.List;

public record LearningModulePdfRequest(
        String title,
        String duration,
        String shareScope,
        List<String> intendedAudience,
        List<String> contentTypes,
        String pdfFilename,
        String pdfUrl,
        String createdByCompanyName
) {
}
