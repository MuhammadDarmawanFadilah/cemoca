package com.shadcn.backend.controller;

import com.shadcn.backend.dto.FileManagerFolderResponse;
import com.shadcn.backend.dto.SchedulerLogResponse;
import com.shadcn.backend.service.SchedulerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/file-manager")
@RequiredArgsConstructor
@Slf4j
public class FileManagerController {

    private final SchedulerService schedulerService;

    @GetMapping("/folders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FileManagerFolderResponse>> getAllFolders() {
        List<FileManagerFolderResponse> folders = schedulerService.getAllFolders();
        return ResponseEntity.ok(folders);
    }

    @PostMapping("/process-now")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> processNow() {
        schedulerService.processNow();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Processing started successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<SchedulerLogResponse>> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        Page<SchedulerLogResponse> logs = schedulerService.getLogs(page, size);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("basePath", schedulerService.getBasePath());
        config.put("enabled", schedulerService.isSchedulerEnabled());
        config.put("intervalHours", schedulerService.getIntervalHours());
        config.put("nextRun", schedulerService.getNextRunTime());
        return ResponseEntity.ok(config);
    }

    @PostMapping("/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam("companyCode") String companyCode,
            @RequestParam("importType") String importType
    ) {
        try {
            schedulerService.saveUploadedFile(file, companyCode, importType);
            Map<String, String> response = new HashMap<>();
            response.put("message", "File uploaded successfully");
            response.put("fileName", file.getOriginalFilename());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to upload file", e);
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
