package com.shadcn.backend.dto;

public record GeminiReviewResponse(
        String clarity,
        String motivationalImpact,
        String recommendationForAgency,
        String suggestions,
        String model,
        String raw
) {
}
