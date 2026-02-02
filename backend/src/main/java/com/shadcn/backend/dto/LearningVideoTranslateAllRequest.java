package com.shadcn.backend.dto;

import java.util.List;

public record LearningVideoTranslateAllRequest(
        String text,
        String sourceLanguageCode,
        List<TargetLanguage> targets
) {
    public record TargetLanguage(String code, String name) {
    }
}
