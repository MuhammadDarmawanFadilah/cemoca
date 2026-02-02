package com.shadcn.backend.dto;

public record LearningVideoReviewRequest(
        String text,
        String inputLanguageCode,
        String inputLanguageName
) {
}
