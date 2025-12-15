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
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
public class DocumentFileService {

    @Value("${app.upload.document-dir:uploads/documents}")
    private String uploadDir;

    @Value("${app.upload.allowed-document-types:ppt,pptx,pdf}")
    private String allowedTypes;

    @Value("${app.document.serve-path:/api/document-files}")
    private String servePath;

    private static final long MAX_SIZE = 100L * 1024 * 1024; // 100MB

    public String saveDocument(MultipartFile file) throws IOException {
        validateFile(file);

        Path basePath = Paths.get(uploadDir);
        if (!basePath.isAbsolute()) {
            basePath = Paths.get(System.getProperty("user.dir")).resolve(uploadDir);
        }
        Path uploadPath = basePath.normalize();
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename);
        String uniqueFilename = UUID.randomUUID() + "." + fileExtension;

        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        log.info("Document saved successfully: {}", uniqueFilename);
        return uniqueFilename;
    }

    public Path getDocumentPath(String filename) {
        Path basePath = Paths.get(uploadDir);
        if (!basePath.isAbsolute()) {
            basePath = Paths.get(System.getProperty("user.dir")).resolve(uploadDir);
        }
        return basePath.normalize().resolve(filename);
    }

    public void deleteDocument(String filename) {
        if (filename == null || filename.isBlank()) {
            return;
        }
        try {
            Path filePath = getDocumentPath(filename.trim());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Error deleting document file: {}", e.getMessage());
        }
    }

    public String getDocumentUrl(String filename) {
        if (filename == null || filename.isBlank()) {
            return null;
        }
        return servePath + "/" + filename;
    }

    private void validateFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("File is empty");
        }

        String fileExtension = getFileExtension(file.getOriginalFilename()).toLowerCase(Locale.ROOT);
        List<String> allowedExtensions = Arrays.asList(allowedTypes.toLowerCase(Locale.ROOT).split(","));
        if (!allowedExtensions.contains(fileExtension)) {
            throw new IOException("File type not allowed. Allowed types: " + allowedTypes);
        }

        if (file.getSize() > MAX_SIZE) {
            throw new IOException("File size exceeds maximum allowed size of 100MB");
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.isBlank()) {
            return "";
        }
        int lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex > 0 ? filename.substring(lastDotIndex + 1) : "";
    }
}
