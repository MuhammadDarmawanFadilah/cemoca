package com.shadcn.backend.dto;

public record LearningVideoPreviewStartResponse(
        boolean success,
        String videoId,
        String status,
        String error
) {
}
