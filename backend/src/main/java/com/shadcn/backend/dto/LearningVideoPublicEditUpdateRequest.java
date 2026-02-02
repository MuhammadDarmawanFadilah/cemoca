package com.shadcn.backend.dto;

import java.util.Map;

public record LearningVideoPublicEditUpdateRequest(
    Map<String, String> translations
) {
}
