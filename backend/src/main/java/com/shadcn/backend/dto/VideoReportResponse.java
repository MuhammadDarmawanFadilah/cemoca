package com.shadcn.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VideoReportResponse {
    private Long id;
    private String reportName;
    private String messageTemplate;
    private String videoLanguageCode;
    private String waMessageTemplate;
    private Boolean useBackground;
    private String backgroundName;
    private String status;
    private Integer totalRecords;
    private Integer processedRecords;
    private Integer successCount;
    private Integer failedCount;
    // Detailed status counts from DB
    private Integer pendingCount;
    private Integer processingCount;
    // WhatsApp blast stats
    private Integer waSentCount;
    private Integer waFailedCount;
    private Integer waPendingCount;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private List<VideoReportItemResponse> items;
    
    // Pagination info for items
    private Integer itemsPage;
    private Integer itemsTotalPages;
    private Long itemsTotalElements;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VideoReportItemResponse {
        private Long id;
        private Integer rowNumber;
        private String name;
        private String phone;
        private String avatar;
        private String personalizedMessage;
        private String providerVideoId;
        private String status;
        private String videoUrl;
        private LocalDateTime videoGeneratedAt;
        private String errorMessage;
        // WhatsApp fields
        private String waStatus;
        private String waMessageId;
        private String waErrorMessage;
        private LocalDateTime waSentAt;
        private Boolean excluded;
    }
}
