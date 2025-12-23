package com.shadcn.backend.dto;

import java.util.List;

public record LearningSchedulePlaceholdersResponse(
        String schedulerType,
        List<String> placeholders
) {}
