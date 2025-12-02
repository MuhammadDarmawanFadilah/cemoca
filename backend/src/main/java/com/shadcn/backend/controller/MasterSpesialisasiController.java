package com.shadcn.backend.controller;

import com.shadcn.backend.dto.MasterSpesialisasiRequest;
import com.shadcn.backend.dto.MasterSpesialisasiResponse;
import com.shadcn.backend.service.MasterSpesialisasiService;
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
@RequestMapping("/api/admin/master-data/spesialisasi")
@RequiredArgsConstructor
@Slf4j
public class MasterSpesialisasiController {
    
    private final MasterSpesialisasiService service;    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Page<MasterSpesialisasiResponse>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        log.info("GET /api/admin/master-data/spesialisasi - search: {}, isActive: {}, page: {}, size: {}", 
                search, isActive, page, size);
        
        Page<MasterSpesialisasiResponse> result = service.findAll(search, isActive, page, size);
        return ResponseEntity.ok(result);
    }
      @GetMapping("/active")
    public ResponseEntity<List<MasterSpesialisasiResponse>> findAllActive() {
        log.info("GET /api/admin/master-data/spesialisasi/active");
        List<MasterSpesialisasiResponse> result = service.findAllActive();
        return ResponseEntity.ok(result);
    }    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterSpesialisasiResponse> findById(@PathVariable Long id) {
        log.info("GET /api/admin/master-data/spesialisasi/{}", id);
        MasterSpesialisasiResponse result = service.findById(id);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterSpesialisasiResponse> create(@Valid @RequestBody MasterSpesialisasiRequest request) {
        log.info("POST /api/admin/master-data/spesialisasi - {}", request);
        MasterSpesialisasiResponse result = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterSpesialisasiResponse> update(@PathVariable Long id, @Valid @RequestBody MasterSpesialisasiRequest request) {
        log.info("PUT /api/admin/master-data/spesialisasi/{} - {}", id, request);
        MasterSpesialisasiResponse result = service.update(id, request);
        return ResponseEntity.ok(result);
    }    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("DELETE /api/admin/master-data/spesialisasi/{}", id);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterSpesialisasiResponse> toggleActive(@PathVariable Long id) {
        log.info("PATCH /api/admin/master-data/spesialisasi/{}/toggle-active", id);
        MasterSpesialisasiResponse result = service.toggleActive(id);
        return ResponseEntity.ok(result);
    }
}
