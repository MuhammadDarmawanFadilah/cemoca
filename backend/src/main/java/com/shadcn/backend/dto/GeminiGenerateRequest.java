package com.shadcn.backend.dto;

public record GeminiGenerateRequest(
        String prompt,
        String language
) {
}
