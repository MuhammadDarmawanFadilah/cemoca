package com.shadcn.backend.controller;

import com.shadcn.backend.dto.VideoBackgroundResponse;
import com.shadcn.backend.service.VideoBackgroundService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/background-management")
@RequiredArgsConstructor
@Slf4j
public class VideoBackgroundManagementController {

    private final VideoBackgroundService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Page<VideoBackgroundResponse>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        Page<VideoBackgroundResponse> result = service.findAll(search, page, size);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<VideoBackgroundResponse> create(
            @RequestParam("backgroundName") String backgroundName,
            @RequestParam("file") MultipartFile file
    ) throws Exception {
        VideoBackgroundResponse created = service.create(backgroundName, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<VideoBackgroundResponse> update(
            @PathVariable Long id,
            @RequestParam(value = "backgroundName", required = false) String backgroundName,
            @RequestParam(value = "file", required = false) MultipartFile file
    ) throws Exception {
        VideoBackgroundResponse updated = service.update(id, backgroundName, file);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
