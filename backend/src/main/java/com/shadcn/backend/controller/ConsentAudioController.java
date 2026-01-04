package com.shadcn.backend.controller;

import com.shadcn.backend.dto.ConsentAudioResponse;
import com.shadcn.backend.service.ConsentAudioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/consent-management")
@RequiredArgsConstructor
@Slf4j
public class ConsentAudioController {

    private final ConsentAudioService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Page<ConsentAudioResponse>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        Page<ConsentAudioResponse> result = service.findAll(search, page, size);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<ConsentAudioResponse> create(
            @RequestParam("avatarName") String avatarName,
            @RequestParam("file") MultipartFile file
    ) throws Exception {
        ConsentAudioResponse created = service.create(avatarName, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<ConsentAudioResponse> update(
            @PathVariable Long id,
            @RequestParam(value = "avatarName", required = false) String avatarName,
            @RequestParam(value = "file", required = false) MultipartFile file
    ) throws Exception {
        ConsentAudioResponse updated = service.update(id, avatarName, file);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
