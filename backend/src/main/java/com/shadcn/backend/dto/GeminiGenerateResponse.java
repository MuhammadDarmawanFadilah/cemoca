package com.shadcn.backend.dto;

public record GeminiGenerateResponse(
        String text,
        int words,
        double estimatedMinutes,
        EstimatedRange estimatedMinutesRange,
        String model
) {
    public record EstimatedRange(double min, double max) {
    }
}
