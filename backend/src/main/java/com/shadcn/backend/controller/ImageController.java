package com.shadcn.backend.controller;

import com.shadcn.backend.service.ImageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/images")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;
    
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        Map<String, String> response = new HashMap<>();
        
        try {
            log.debug("Uploading image file: {}", file.getOriginalFilename());
            String filename = imageService.saveImage(file);
            String imageUrl = imageService.getImageUrl(filename);
            
            response.put("success", "true");
            response.put("filename", filename);
            response.put("url", imageUrl);
            
            log.info("Image uploaded successfully: {}", filename);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Failed to upload image: {}", e.getMessage());
            response.put("success", "false");
            response.put("error", e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serveImage(@PathVariable("filename") String filename) {
        try {
            Path imagePath = imageService.getImagePath(filename);
            Resource resource = new UrlResource(imagePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                String contentType = getContentType(filename);
                
                return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=86400") // Cache for 1 day
                    .body(resource);
            } else {
                log.warn("Image not found or not readable: {}", filename);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error serving image: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{filename:.+}")
    public ResponseEntity<Map<String, String>> deleteImage(@PathVariable("filename") String filename) {
        Map<String, String> response = new HashMap<>();
        
        try {
            imageService.deleteImage(filename);
            response.put("success", "true");
            response.put("message", "Image deleted successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", "false");
            response.put("error", e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    private String getContentType(String filename) {
        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        switch (extension) {
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "png":
                return "image/png";
            case "gif":
                return "image/gif";
            case "mp4":
                return "video/mp4";
            case "avi":
                return "video/avi";
            case "mov":
                return "video/quicktime";
            case "wmv":
                return "video/x-ms-wmv";
            case "flv":
                return "video/x-flv";
            case "webm":
                return "video/webm";
            default:
                return "application/octet-stream";
        }
    }
}
