package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PdfReportRequest {
    private String reportName;
    private String messageTemplate; // PDF content template with :name placeholder
    private String waMessageTemplate; // WhatsApp message template with :linkpdf parameter
    private List<PdfReportItemRequest> items;
    private Long userId; // User ID for report creator

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PdfReportItemRequest {
        private Integer rowNumber;
        private String name;
        private String phone;
    }
}
