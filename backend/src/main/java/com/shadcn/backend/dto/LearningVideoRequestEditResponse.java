package com.shadcn.backend.dto;

public record LearningVideoRequestEditResponse(
    boolean success,
    String token,
    String message
) {
}
