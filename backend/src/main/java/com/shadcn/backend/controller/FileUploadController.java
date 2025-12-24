package com.shadcn.backend.controller;

import com.shadcn.backend.service.ImageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/upload")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
@RequiredArgsConstructor
public class FileUploadController {

    private final ImageService imageService;

    @PostMapping("/image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        Map<String, String> response = new HashMap<>();
        try {
            String filename = imageService.saveImage(file);
            String imageUrl = imageService.getImageUrl(filename);

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

    @DeleteMapping("/image/{filename:.+}")
    public ResponseEntity<Map<String, String>> deleteImage(@PathVariable("filename") String filename) {
        Map<String, String> response = new HashMap<>();
        imageService.deleteImage(filename);
        response.put("success", "true");
        response.put("message", "File deleted successfully");
        return ResponseEntity.ok(response);
    }
}