package com.shadcn.backend.dto;

public record MasterPolicySalesImportError(
        int rowNumber,
        String column,
        String message,
        String rawValue
) {
}
