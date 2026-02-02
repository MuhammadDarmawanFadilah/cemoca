package com.shadcn.backend.dto;

import java.util.List;

public record LearningVideoRequestEditRequest(
    String phoneNumber,
    List<String> languageCodes
) {
}
