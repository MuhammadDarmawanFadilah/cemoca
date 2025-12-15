package com.shadcn.backend.controller;

import com.shadcn.backend.service.DocumentFileService;
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
import java.util.Locale;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/document-files")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
@RequiredArgsConstructor
public class DocumentFileController {

    private final DocumentFileService documentFileService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> upload(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        try {
            String filename = documentFileService.saveDocument(file);
            String url = documentFileService.getDocumentUrl(filename);

            response.put("success", true);
            response.put("filename", filename);
            response.put("url", url);
            response.put("message", "Uploaded");
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Failed to upload document file: {}", e.getMessage());
            response.put("success", false);
            response.put("message", e.getMessage());
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error("Failed to upload document file", e);
            response.put("success", false);
            response.put("message", "Upload failed");
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serve(@PathVariable("filename") String filename) {
        try {
            Path filePath = documentFileService.getDocumentPath(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = guessContentType(filename);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, contentType)
                        .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                        .body(resource);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error serving document file: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{filename:.+}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable("filename") String filename) {
        Map<String, Object> response = new HashMap<>();
        try {
            documentFileService.deleteDocument(filename);
            response.put("success", true);
            response.put("message", "Deleted");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    private String guessContentType(String filename) {
        String ext = "";
        int dot = filename.lastIndexOf('.');
        if (dot >= 0 && dot < filename.length() - 1) {
            ext = filename.substring(dot + 1).toLowerCase(Locale.ROOT);
        }
        switch (ext) {
            case "pdf":
                return MediaType.APPLICATION_PDF_VALUE;
            case "ppt":
                return "application/vnd.ms-powerpoint";
            case "pptx":
                return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            default:
                return MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
    }
}
