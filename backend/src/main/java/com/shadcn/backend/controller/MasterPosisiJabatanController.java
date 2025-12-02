package com.shadcn.backend.controller;

import com.shadcn.backend.dto.MasterPosisiJabatanRequest;
import com.shadcn.backend.dto.MasterPosisiJabatanResponse;
import com.shadcn.backend.service.MasterPosisiJabatanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/master-data/posisi-jabatan")
@RequiredArgsConstructor
@Slf4j
public class MasterPosisiJabatanController {
    
    private final MasterPosisiJabatanService service;
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Page<MasterPosisiJabatanResponse>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        log.info("GET /api/admin/master-data/posisi-jabatan - search: {}, isActive: {}, page: {}, size: {}", 
                search, isActive, page, size);
        
        Page<MasterPosisiJabatanResponse> result = service.findAll(search, isActive, page, size);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<MasterPosisiJabatanResponse>> findAllActive() {
        log.info("GET /api/admin/master-data/posisi-jabatan/active");
        List<MasterPosisiJabatanResponse> result = service.findAllActive();
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterPosisiJabatanResponse> findById(@PathVariable Long id) {
        log.info("GET /api/admin/master-data/posisi-jabatan/{}", id);
        MasterPosisiJabatanResponse result = service.findById(id);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterPosisiJabatanResponse> create(@Valid @RequestBody MasterPosisiJabatanRequest request) {
        log.info("POST /api/admin/master-data/posisi-jabatan - {}", request);
        MasterPosisiJabatanResponse result = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterPosisiJabatanResponse> update(@PathVariable Long id, @Valid @RequestBody MasterPosisiJabatanRequest request) {
        log.info("PUT /api/admin/master-data/posisi-jabatan/{} - {}", id, request);
        MasterPosisiJabatanResponse result = service.update(id, request);
        return ResponseEntity.ok(result);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("DELETE /api/admin/master-data/posisi-jabatan/{}", id);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterPosisiJabatanResponse> toggleActive(@PathVariable Long id) {
        log.info("PATCH /api/admin/master-data/posisi-jabatan/{}/toggle-active", id);
        MasterPosisiJabatanResponse result = service.toggleActive(id);
        return ResponseEntity.ok(result);
    }
}
