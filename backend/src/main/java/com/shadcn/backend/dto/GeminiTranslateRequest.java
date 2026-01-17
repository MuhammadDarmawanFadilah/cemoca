package com.shadcn.backend.dto;

public record GeminiTranslateRequest(
        String text,
        String targetLanguageCode,
        String targetLanguageName
) {
}
