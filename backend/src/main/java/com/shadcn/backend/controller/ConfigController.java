package com.shadcn.backend.controller;

import com.shadcn.backend.config.AppProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    @Autowired
    private AppProperties appProperties;

    @GetMapping("/upload-limits")
    public ResponseEntity<Map<String, Object>> getUploadLimits() {
        Map<String, Object> config = new HashMap<>();
        
        // File size limits in bytes
        config.put("maxImageSize", appProperties.getUpload().getImageMaxSize().toBytes());
        config.put("maxVideoSize", appProperties.getUpload().getVideoMaxSize().toBytes());
        config.put("maxDocumentSize", appProperties.getDocument().getMaxFileSize().toBytes());
        
        // File size limits in MB (for display)
        config.put("maxImageSizeMB", appProperties.getUpload().getImageMaxSize().toMegabytes());
        config.put("maxVideoSizeMB", appProperties.getUpload().getVideoMaxSize().toMegabytes());
        config.put("maxDocumentSizeMB", appProperties.getDocument().getMaxFileSize().toMegabytes());
        
        // Allowed file types
        config.put("allowedImageTypes", appProperties.getUpload().getAllowedTypes());
        config.put("allowedDocumentTypes", appProperties.getDocument().getAllowedTypes());
        
        return ResponseEntity.ok(config);
    }
}
