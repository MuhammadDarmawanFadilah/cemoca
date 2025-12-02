package com.shadcn.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class ImageService {

    @Value("${app.upload.image-dir:storage/images}")
    private String uploadDir;

    @Value("${app.upload.allowed-types:jpg,jpeg,png,gif,mp4,avi,mov,wmv,flv,webm}")
    private String allowedTypes;

    @Value("${app.image.serve-path:/images}")
    private String servePath;

    // Image files: 10MB, Video files: 100MB
    private static final long IMAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
    private static final long VIDEO_MAX_SIZE = 100 * 1024 * 1024; // 100MB

    public String saveImage(MultipartFile file) throws IOException {
        log.debug("Saving image file: {}", file.getOriginalFilename());
        
        // Validate file
        validateFile(file);

        // Resolve upload directory (support relative path under working dir)
        Path basePath = Paths.get(uploadDir);
        if (!basePath.isAbsolute()) {
            basePath = Paths.get(System.getProperty("user.dir")).resolve(uploadDir);
        }
        Path uploadPath = basePath.normalize();
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            log.debug("Created upload directory: {}", uploadPath);
        }

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename);
        String uniqueFilename = UUID.randomUUID().toString() + "." + fileExtension;

        // Save file
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        log.info("Image saved successfully: {}", uniqueFilename);
        return uniqueFilename;
    }

    public void deleteImage(String filename) {
        if (filename != null && !filename.isEmpty()) {
            try {
                Path filePath = Paths.get(uploadDir).resolve(filename);
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                // Log error but don't throw exception
                System.err.println("Error deleting image: " + e.getMessage());
            }
        }
    }

    public Path getImagePath(String filename) {
        Path basePath = Paths.get(uploadDir);
        if (!basePath.isAbsolute()) {
            basePath = Paths.get(System.getProperty("user.dir")).resolve(uploadDir);
        }
        return basePath.normalize().resolve(filename);
    }

    public String getImageUrl(String filename) {
        if (filename == null || filename.isEmpty()) {
            return null;
        }
        return servePath + "/" + filename;
    }

    private void validateFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("File is empty");
        }

        String fileExtension = getFileExtension(file.getOriginalFilename()).toLowerCase();
        List<String> allowedExtensions = Arrays.asList(allowedTypes.toLowerCase().split(","));
        
        if (!allowedExtensions.contains(fileExtension)) {
            throw new IOException("File type not allowed. Allowed types: " + allowedTypes);
        }

        // Check file size based on type
        boolean isVideo = Arrays.asList("mp4", "avi", "mov", "wmv", "flv", "webm").contains(fileExtension);
        long maxSize = isVideo ? VIDEO_MAX_SIZE : IMAGE_MAX_SIZE;
        String sizeLimit = isVideo ? "100MB" : "10MB";
        
        if (file.getSize() > maxSize) {
            throw new IOException("File size exceeds maximum allowed size of " + sizeLimit);
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        int lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex > 0 ? filename.substring(lastDotIndex + 1) : "";
    }
}
