package com.shadcn.backend.dto;

public record MasterAgencyAgentImportError(
        int rowNumber,
        String column,
        String message,
        String rawValue
) {
}
