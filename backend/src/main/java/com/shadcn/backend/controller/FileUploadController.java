package com.shadcn.backend.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/upload")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class FileUploadController {

    @Value("${app.upload.dir:/storage}")
    private String uploadDir;
    
    @Value("${app.base.url:http://localhost:8080}")
    private String baseUrl;

    @PostMapping("/image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        Map<String, String> response = new HashMap<>();
        try {
            String filename = saveFile(file);
            String imageUrl = baseUrl + "/api/files/" + filename;

            response.put("success", "true");
            response.put("message", "File uploaded successfully");
            response.put("url", imageUrl);
            response.put("filename", filename);

            log.info("File uploaded successfully: {} -> {}", filename, imageUrl);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Error uploading file: ", e);
            response.put("success", "false");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/video")
    public ResponseEntity<Map<String, String>> uploadVideo(@RequestParam("file") MultipartFile file) {
        Map<String, String> response = new HashMap<>();
        try {
            String filename = saveFile(file);
            String videoUrl = baseUrl + "/api/files/" + filename;

            response.put("success", "true");
            response.put("message", "Video uploaded successfully");
            response.put("url", videoUrl);
            response.put("filename", filename);

            log.info("Video uploaded successfully: {} -> {}", filename, videoUrl);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Error uploading video: ", e);
            response.put("success", "false");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/image/{filename:.+}")
    public ResponseEntity<Map<String, String>> deleteImage(@PathVariable("filename") String filename) {
        Map<String, String> response = new HashMap<>();
        try {
            deleteFile(filename);
            response.put("success", "true");
            response.put("message", "File deleted successfully");
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Error deleting file: ", e);
            response.put("success", "false");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    private String saveFile(MultipartFile file) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".") ? 
            originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
        String filename = UUID.randomUUID().toString() + extension;
        
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath);
        
        return filename;
    }
    
    private void deleteFile(String filename) throws IOException {
        Path filePath = Paths.get(uploadDir).resolve(filename);
        if (Files.exists(filePath)) {
            Files.delete(filePath);
        }
    }
}