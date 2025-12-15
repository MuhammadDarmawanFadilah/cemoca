package com.shadcn.backend.dto;

import java.util.List;

public record MasterPolicySalesImportResult(
        boolean success,
        int createdCount,
        int updatedCount,
        List<MasterPolicySalesImportError> errors
) {
}
