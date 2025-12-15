package com.shadcn.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record MasterPolicySalesResponse(
        Long id,
        String agentCode,
        LocalDate policyDate,
        String policyCode,
        BigDecimal policyApe,
        String createdBy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
