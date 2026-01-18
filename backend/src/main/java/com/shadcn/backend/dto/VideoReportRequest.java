package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VideoReportRequest {
    private String reportName;
    private String messageTemplate;
    private String videoLanguageCode;
    private Double voiceSpeed;
    private Double voicePitch;
    private Boolean enableCaption;
    private String waMessageTemplate; // WhatsApp message template with :linkvideo parameter
    private Boolean useBackground;
    private String backgroundName;
    private Boolean preview;
    private List<VideoReportItemRequest> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VideoReportItemRequest {
        private Integer rowNumber;
        private String name;
        private String phone;
        private String avatar;
    }
}
