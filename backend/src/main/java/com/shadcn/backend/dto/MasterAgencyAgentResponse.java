package com.shadcn.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record MasterAgencyAgentResponse(
        Long id,
        String agentCode,
        String fullName,
        String shortName,
        LocalDate birthday,
        String gender,
        String genderTitle,
        String phoneNo,
        String rankCode,
        String rankTitle,
        LocalDate appointmentDate,
        Boolean isActive,
        String createdBy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
