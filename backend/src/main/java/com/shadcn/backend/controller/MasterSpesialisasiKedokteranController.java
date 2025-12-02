package com.shadcn.backend.controller;

import com.shadcn.backend.dto.MasterSpesialisasiKedokteranRequest;
import com.shadcn.backend.dto.MasterSpesialisasiKedokteranResponse;
import com.shadcn.backend.service.MasterSpesialisasiKedokteranService;
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
@RequestMapping("/api/admin/master-data/spesialisasi-kedokteran")
@RequiredArgsConstructor
@Slf4j
public class MasterSpesialisasiKedokteranController {
    
    private final MasterSpesialisasiKedokteranService service;
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Page<MasterSpesialisasiKedokteranResponse>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        log.info("GET /api/admin/master-data/spesialisasi-kedokteran - search: {}, isActive: {}, page: {}, size: {}", 
                search, isActive, page, size);
        
        Page<MasterSpesialisasiKedokteranResponse> result = service.findAll(search, isActive, page, size);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<MasterSpesialisasiKedokteranResponse>> findAllActive() {
        log.info("GET /api/admin/master-data/spesialisasi-kedokteran/active");
        List<MasterSpesialisasiKedokteranResponse> result = service.findAllActive();
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterSpesialisasiKedokteranResponse> findById(@PathVariable Long id) {
        log.info("GET /api/admin/master-data/spesialisasi-kedokteran/{}", id);
        MasterSpesialisasiKedokteranResponse result = service.findById(id);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterSpesialisasiKedokteranResponse> create(@Valid @RequestBody MasterSpesialisasiKedokteranRequest request) {
        log.info("POST /api/admin/master-data/spesialisasi-kedokteran - {}", request);
        MasterSpesialisasiKedokteranResponse result = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterSpesialisasiKedokteranResponse> update(@PathVariable Long id, @Valid @RequestBody MasterSpesialisasiKedokteranRequest request) {
        log.info("PUT /api/admin/master-data/spesialisasi-kedokteran/{} - {}", id, request);
        MasterSpesialisasiKedokteranResponse result = service.update(id, request);
        return ResponseEntity.ok(result);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("DELETE /api/admin/master-data/spesialisasi-kedokteran/{}", id);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterSpesialisasiKedokteranResponse> toggleActive(@PathVariable Long id) {
        log.info("PATCH /api/admin/master-data/spesialisasi-kedokteran/{}/toggle-active", id);
        MasterSpesialisasiKedokteranResponse result = service.toggleActive(id);
        return ResponseEntity.ok(result);
    }
}
