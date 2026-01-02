package com.shadcn.backend.service;

import com.shadcn.backend.dto.AvatarAudioResponse;
import com.shadcn.backend.model.AvatarAudio;
import com.shadcn.backend.repository.AvatarAudioRepository;
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
public class AvatarAudioService {

    private final AvatarAudioRepository repository;

    @Value("${app.audio.upload-dir:${user.home}/cemoca/uploads/audio}")
    private String uploadDir;

    public Page<AvatarAudioResponse> findAll(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        String q = search == null ? "" : search.trim();
        if (q.isBlank()) {
            return repository.findAll(pageable).map(this::toResponse);
        }
        return repository.findByAvatarNameContainingIgnoreCaseOrNormalizedKeyContainingIgnoreCase(q, q, pageable)
                .map(this::toResponse);
    }

    @Transactional
    public AvatarAudioResponse create(String avatarName, MultipartFile file) throws IOException {
        String name = validateAvatarName(avatarName);
        validateFile(file);

        String normalizedKey = normalizeKey(name);

        String storedFilename = buildStoredFilename(normalizedKey, file);
        Path dir = Paths.get(uploadDir);
        Files.createDirectories(dir);
        Path target = dir.resolve(storedFilename);
        Files.copy(file.getInputStream(), target);

        AvatarAudio entity = AvatarAudio.builder()
                .avatarName(name)
                .normalizedKey(normalizedKey)
                .originalFilename(safeFilename(file.getOriginalFilename()))
                .storedFilename(storedFilename)
                .mimeType(safeMimeType(file.getContentType(), storedFilename))
                .fileSize(file.getSize())
                .filePath(target.toAbsolutePath().toString())
                .build();

        AvatarAudio saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public AvatarAudioResponse update(Long id, String avatarName, MultipartFile file) throws IOException {
        AvatarAudio existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Avatar audio not found"));

        if (avatarName != null && !avatarName.trim().isBlank()) {
            String name = validateAvatarName(avatarName);
            existing.setAvatarName(name);
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

        AvatarAudio saved = repository.save(existing);
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        AvatarAudio existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Avatar audio not found"));
        deleteFileQuietly(existing.getFilePath());
        repository.delete(existing);
    }

    public static String normalizeKey(String input) {
        if (input == null) return "";
        String trimmed = input.trim().toLowerCase(Locale.ROOT);
        return trimmed.replaceAll("\\s+", "");
    }

    private String validateAvatarName(String avatarName) {
        String name = avatarName == null ? "" : avatarName.trim();
        if (name.isBlank()) {
            throw new IllegalArgumentException("Avatar name is required");
        }
        if (name.length() > 150) {
            throw new IllegalArgumentException("Avatar name is too long");
        }
        return name;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        String filename = safeFilename(file.getOriginalFilename());
        String lower = filename.toLowerCase(Locale.ROOT);
        boolean ok = lower.endsWith(".mp3") || lower.endsWith(".mp4");
        if (!ok) {
            throw new IllegalArgumentException("Only MP3 or MP4 files are allowed");
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
        String key = normalizedKey == null || normalizedKey.isBlank() ? "avatar" : normalizedKey;
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
        if (lower.endsWith(".mp3")) return "audio/mpeg";
        if (lower.endsWith(".mp4")) return "video/mp4";
        return "application/octet-stream";
    }

    private void deleteFileQuietly(String path) {
        if (path == null || path.isBlank()) return;
        try {
            Files.deleteIfExists(Paths.get(path));
        } catch (Exception ignored) {
        }
    }

    private AvatarAudioResponse toResponse(AvatarAudio a) {
        return AvatarAudioResponse.builder()
                .id(a.getId())
                .avatarName(a.getAvatarName())
                .normalizedKey(a.getNormalizedKey())
                .originalFilename(a.getOriginalFilename())
                .storedFilename(a.getStoredFilename())
                .mimeType(a.getMimeType())
                .fileSize(a.getFileSize())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
