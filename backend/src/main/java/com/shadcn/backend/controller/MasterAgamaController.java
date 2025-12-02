package com.shadcn.backend.controller;

import com.shadcn.backend.dto.MasterAgamaRequest;
import com.shadcn.backend.dto.MasterAgamaResponse;
import com.shadcn.backend.service.MasterAgamaService;
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
@RequestMapping("/api/admin/master-data/agama")
@RequiredArgsConstructor
@Slf4j
public class MasterAgamaController {
    
    private final MasterAgamaService service;
      @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Page<MasterAgamaResponse>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "sortOrder") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        log.info("GET /api/admin/master-data/agama - search: {}, isActive: {}, page: {}, size: {}, sortBy: {}, sortDir: {}", 
                search, isActive, page, size, sortBy, sortDir);
        
        Page<MasterAgamaResponse> result = service.findAll(search, isActive, page, size, sortBy, sortDir);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<MasterAgamaResponse>> findAllActive() {
        log.info("GET /api/admin/master-data/agama/active");
        List<MasterAgamaResponse> result = service.findAllActive();
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterAgamaResponse> findById(@PathVariable Long id) {
        log.info("GET /api/admin/master-data/agama/{}", id);
        MasterAgamaResponse result = service.findById(id);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterAgamaResponse> create(@Valid @RequestBody MasterAgamaRequest request) {
        log.info("POST /api/admin/master-data/agama - {}", request);
        MasterAgamaResponse result = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterAgamaResponse> update(@PathVariable Long id, @Valid @RequestBody MasterAgamaRequest request) {
        log.info("PUT /api/admin/master-data/agama/{} - {}", id, request);
        MasterAgamaResponse result = service.update(id, request);
        return ResponseEntity.ok(result);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("DELETE /api/admin/master-data/agama/{}", id);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterAgamaResponse> toggleActive(@PathVariable Long id) {
        log.info("PATCH /api/admin/master-data/agama/{}/toggle-active", id);
        MasterAgamaResponse result = service.toggleActive(id);
        return ResponseEntity.ok(result);
    }
}
