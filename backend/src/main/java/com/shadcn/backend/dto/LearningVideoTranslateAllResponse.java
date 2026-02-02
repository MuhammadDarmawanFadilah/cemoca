package com.shadcn.backend.dto;

import java.util.Map;

public record LearningVideoTranslateAllResponse(
        Map<String, String> translations
) {
}
