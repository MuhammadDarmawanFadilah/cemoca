package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {
    
    private String title;
    private String message;
    private List<String> recipients;
    private String type; // "text" or "image"
    private MultipartFile image;
    
    public NotificationRequest(String title, String message, List<String> recipients, String type) {
        this.title = title;
        this.message = message;
        this.recipients = recipients;
        this.type = type;
    }
}
