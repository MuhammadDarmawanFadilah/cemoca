package com.shadcn.backend.dto;

import java.util.Map;

public record LearningVideoCreateRequest(
        String sourceLanguageCode,
        String sourceText,
        Map<String, String> translations,
        GeminiReviewResponse review
) {
}
