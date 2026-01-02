package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VideoPreviewResponse {
    private boolean success;
    private String videoId;
    private String status;
    private String type;
    private String resultUrl;
    private String error;
}
