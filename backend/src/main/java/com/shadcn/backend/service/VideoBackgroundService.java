package com.shadcn.backend.service;

import com.shadcn.backend.dto.VideoBackgroundResponse;
import com.shadcn.backend.model.VideoBackground;
import com.shadcn.backend.repository.VideoBackgroundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class VideoBackgroundService {

    private final VideoBackgroundRepository repository;

    @Value("${app.background.upload-dir:${user.home}/cemoca/uploads/backgrounds}")
    private String uploadDir;

    public Page<VideoBackgroundResponse> findAll(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        String q = search == null ? "" : search.trim();
        if (q.isBlank()) {
            return repository.findAll(pageable).map(this::toResponse);
        }
        return repository.findByBackgroundNameContainingIgnoreCaseOrNormalizedKeyContainingIgnoreCase(q, q, pageable)
                .map(this::toResponse);
    }

    public java.util.List<String> listNames() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "backgroundName"))
                .stream()
                .map(VideoBackground::getBackgroundName)
                .filter(n -> n != null && !n.isBlank())
                .distinct()
                .toList();
    }

    public VideoBackground getByName(String backgroundName) {
        String key = normalizeKey(backgroundName);
        return repository.findFirstByNormalizedKey(key)
                .orElseThrow(() -> new IllegalArgumentException("Background not found"));
    }

    @Transactional
    public VideoBackgroundResponse create(String backgroundName, MultipartFile file) throws IOException {
        String name = validateName(backgroundName);
        validateFile(file);

        String normalizedKey = normalizeKey(name);

        String storedFilename = buildStoredFilename(normalizedKey, file);
        Path dir = Paths.get(uploadDir);
        Files.createDirectories(dir);
        Path target = dir.resolve(storedFilename);
        Files.copy(file.getInputStream(), target);

        VideoBackground entity = VideoBackground.builder()
                .backgroundName(name)
                .normalizedKey(normalizedKey)
                .originalFilename(safeFilename(file.getOriginalFilename()))
                .storedFilename(storedFilename)
                .mimeType(safeMimeType(file.getContentType(), storedFilename))
                .fileSize(file.getSize())
                .filePath(target.toAbsolutePath().toString())
                .build();

        VideoBackground saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public VideoBackgroundResponse update(Long id, String backgroundName, MultipartFile file) throws IOException {
        VideoBackground existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Background not found"));

        if (backgroundName != null && !backgroundName.trim().isBlank()) {
            String name = validateName(backgroundName);
            existing.setBackgroundName(name);
            existing.setNormalizedKey(normalizeKey(name));
        }

        if (file != null && !file.isEmpty()) {
            validateFile(file);
            deleteFileQuietly(existing.getFilePath());

            String storedFilename = buildStoredFilename(existing.getNormalizedKey(), file);
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            Path target = dir.resolve(storedFilename);
            Files.copy(file.getInputStream(), target);

            existing.setOriginalFilename(safeFilename(file.getOriginalFilename()));
            existing.setStoredFilename(storedFilename);
            existing.setMimeType(safeMimeType(file.getContentType(), storedFilename));
            existing.setFileSize(file.getSize());
            existing.setFilePath(target.toAbsolutePath().toString());
        }

        VideoBackground saved = repository.save(existing);
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        VideoBackground existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Background not found"));
        deleteFileQuietly(existing.getFilePath());
        repository.delete(existing);
    }

    public static String normalizeKey(String input) {
        if (input == null) return "";
        String trimmed = input.trim().toLowerCase(Locale.ROOT);
        return trimmed.replaceAll("\\s+", "");
    }

    private String validateName(String backgroundName) {
        String name = backgroundName == null ? "" : backgroundName.trim();
        if (name.isBlank()) {
            throw new IllegalArgumentException("Background name is required");
        }
        if (name.contains("..") || name.contains("/") || name.contains("\\")) {
            throw new IllegalArgumentException("Invalid background name");
        }
        if (name.length() > 150) {
            throw new IllegalArgumentException("Background name is too long");
        }
        return name;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        String filename = safeFilename(file.getOriginalFilename());
        String lower = filename.toLowerCase(Locale.ROOT);
        boolean ok = lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".gif") || lower.endsWith(".webp");
        if (!ok) {
            throw new IllegalArgumentException("Only JPG, PNG, GIF, or WEBP images are allowed");
        }
    }

    private String buildStoredFilename(String normalizedKey, MultipartFile file) {
        String original = safeFilename(file.getOriginalFilename());
        String ext = "";
        int idx = original.lastIndexOf('.');
        if (idx >= 0) {
            ext = original.substring(idx).toLowerCase(Locale.ROOT);
        }
        long ts = Instant.now().toEpochMilli();
        String key = normalizedKey == null || normalizedKey.isBlank() ? "background" : normalizedKey;
        return key + "_" + ts + ext;
    }

    private String safeFilename(String filename) {
        if (filename == null) return "file";
        String f = filename.trim();
        if (f.isBlank()) return "file";
        return f.replaceAll("[\\r\\n]", "");
    }

    private String safeMimeType(String contentType, String storedFilename) {
        String ct = contentType == null ? "" : contentType.trim();
        if (!ct.isBlank()) return ct;
        String lower = storedFilename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }

    private void deleteFileQuietly(String path) {
        if (path == null || path.isBlank()) return;
        try {
            Files.deleteIfExists(Paths.get(path));
        } catch (Exception ignored) {
        }
    }

    private VideoBackgroundResponse toResponse(VideoBackground b) {
        return VideoBackgroundResponse.builder()
                .id(b.getId())
                .backgroundName(b.getBackgroundName())
                .normalizedKey(b.getNormalizedKey())
                .originalFilename(b.getOriginalFilename())
                .storedFilename(b.getStoredFilename())
                .mimeType(b.getMimeType())
                .fileSize(b.getFileSize())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
