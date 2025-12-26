package com.shadcn.backend.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/video-backgrounds")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class VideoBackgroundController {

    @GetMapping
    public ResponseEntity<List<String>> listBackgrounds() {
        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources("classpath:/background/*");

            List<String> names = new ArrayList<>();
            for (Resource r : resources) {
                if (r == null) continue;
                String name = r.getFilename();
                if (name == null || name.isBlank()) continue;
                names.add(name);
            }

            names.sort(String.CASE_INSENSITIVE_ORDER);
            return ResponseEntity.ok(names);
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

            Resource resource = new ClassPathResource("background/" + filename);
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = getContentType(filename);
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
