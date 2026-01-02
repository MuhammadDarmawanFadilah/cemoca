package com.shadcn.backend.controller;

import com.shadcn.backend.model.VideoBackground;
import com.shadcn.backend.service.VideoBackgroundService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@RestController
@RequestMapping("/api/video-backgrounds")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class VideoBackgroundController {

    private final VideoBackgroundService service;

    public VideoBackgroundController(VideoBackgroundService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<String>> listBackgrounds() {
        try {
            List<String> names = service.listNames();
            return ResponseEntity.ok(names == null ? Collections.emptyList() : names);
        } catch (Exception e) {
            log.error("Error listing video backgrounds: {}", e.getMessage());
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> getBackground(@PathVariable("filename") String filename) {
        try {
            if (filename == null || filename.isBlank() || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
                return ResponseEntity.badRequest().build();
            }

            VideoBackground bg;
            try {
                bg = service.getByName(filename);
            } catch (Exception e) {
                return ResponseEntity.notFound().build();
            }

            String filePath = bg.getFilePath();
            if (filePath == null || filePath.isBlank()) {
                return ResponseEntity.notFound().build();
            }

            Path path = Paths.get(filePath);
            if (!Files.isRegularFile(path) || !Files.isReadable(path)) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new org.springframework.core.io.FileSystemResource(path);

            String contentType = bg.getMimeType();
            if (contentType == null || contentType.isBlank()) {
                contentType = getContentType(filename);
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            log.error("Error serving video background {}: {}", filename, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    private String getContentType(String filename) {
        int dot = filename.lastIndexOf('.');
        String extension = dot >= 0 ? filename.substring(dot + 1).toLowerCase(Locale.ROOT) : "";
        switch (extension) {
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "png":
                return "image/png";
            case "gif":
                return "image/gif";
            case "webp":
                return "image/webp";
            default:
                return "application/octet-stream";
        }
    }
}
