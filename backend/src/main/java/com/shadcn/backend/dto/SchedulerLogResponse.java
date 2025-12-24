package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SchedulerLogResponse {
    private Long id;
    private String companyCode;
    private String importType;
    private String fileName;
    private String filePath;
    private String status;
    private Integer createdCount;
    private Integer updatedCount;
    private Integer errorCount;
    private String errorMessage;
    private String processedBy;
    private LocalDateTime processedAt;
}
