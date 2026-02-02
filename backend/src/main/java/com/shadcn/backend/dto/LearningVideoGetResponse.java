package com.shadcn.backend.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record LearningVideoGetResponse(
        Long id,
        String code,
        String sourceLanguageCode,
        String sourceText,
        GeminiReviewResponse review,
        Map<String, String> translations,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
