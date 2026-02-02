package com.shadcn.backend.dto;

public record LearningVideoPreviewStatusResponse(
        boolean success,
        String videoId,
        String status,
        String videoUrl,
        String error
) {
}
