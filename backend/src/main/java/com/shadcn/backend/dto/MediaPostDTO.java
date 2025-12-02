package com.shadcn.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MediaPostDTO {
    private Long mediaId;
    private Long postId;
    private String mediaUrl;
    private String mediaType;
    private Integer mediaOrder;
    private String caption;
    private String originalFileName;
    private Long fileSize;
    private String mimeType;
    private String thumbnailUrl;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    // Helper methods
    public boolean isImage() {
        return "IMAGE".equals(this.mediaType);
    }
    
    public boolean isVideo() {
        return "VIDEO".equals(this.mediaType);
    }
    
    public boolean isDocument() {
        return "DOCUMENT".equals(this.mediaType);
    }
    
    public String getDisplayUrl() {
        if (isVideo() && thumbnailUrl != null) {
            return thumbnailUrl;
        }
        return mediaUrl;
    }
}
