package com.shadcn.backend.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
public class NotificationRequest {
    private String title;
    private String message;
    private List<String> recipients;
    private String type;
    private MultipartFile image;
}
