package com.shadcn.backend.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/video-backgrounds")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class VideoBackgroundController {

    @Value("${app.video.backgrounds.dir:}")
    private String backgroundsDir;

    @GetMapping
    public ResponseEntity<List<String>> listBackgrounds() {
        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Set<String> names = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);

            for (String pattern : List.of(
                    "classpath*:background/*",
                    "classpath*:background/**/*"
            )) {
                try {
                    Resource[] resources = resolver.getResources(pattern);
                    for (Resource r : resources) {
                        if (r == null) {
                            continue;
                        }
                        String name = r.getFilename();
                        if (name == null || name.isBlank()) {
                            continue;
                        }
                        if (!isSupportedImage(name)) {
                            continue;
                        }
                        names.add(name);
                    }
                } catch (Exception ignored) {
                }
            }

            Path dir = resolveBackgroundsDir();
            if (dir != null && Files.isDirectory(dir)) {
                try (var stream = Files.list(dir)) {
                    stream
                            .filter(Files::isRegularFile)
                            .map(p -> p.getFileName() == null ? null : p.getFileName().toString())
                            .filter(Objects::nonNull)
                            .filter(n -> !n.isBlank())
                            .filter(this::isSupportedImage)
                            .forEach(names::add);
                } catch (Exception ignored) {
                }
            }

            return ResponseEntity.ok(new ArrayList<>(names));
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

            if (!isSupportedImage(filename)) {
                return ResponseEntity.badRequest().build();
            }

            Resource resource = new ClassPathResource("background/" + filename);
            if (!resource.exists() || !resource.isReadable()) {
                Path dir = resolveBackgroundsDir();
                if (dir != null && Files.isDirectory(dir)) {
                    Path resolved = dir.resolve(filename).normalize();
                    if (resolved.startsWith(dir) && Files.isRegularFile(resolved) && Files.isReadable(resolved)) {
                        resource = new FileSystemResource(resolved);
                    }
                }
            }

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

    private boolean isSupportedImage(String filename) {
        if (filename == null) {
            return false;
        }
        String lower = filename.trim().toLowerCase(Locale.ROOT);
        return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".gif") || lower.endsWith(".webp");
    }

    private Path resolveBackgroundsDir() {
        try {
            if (backgroundsDir == null) {
                return null;
            }
            String raw = backgroundsDir.trim();
            if (raw.isEmpty()) {
                return null;
            }
            return Paths.get(raw).toAbsolutePath().normalize();
        } catch (Exception ignored) {
            return null;
        }
    }
}
