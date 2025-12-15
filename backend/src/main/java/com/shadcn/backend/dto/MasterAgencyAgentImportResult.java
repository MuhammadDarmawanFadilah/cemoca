package com.shadcn.backend.dto;

import java.util.List;

public record MasterAgencyAgentImportResult(
        boolean success,
        int createdCount,
        int updatedCount,
        List<MasterAgencyAgentImportError> errors
) {
}
