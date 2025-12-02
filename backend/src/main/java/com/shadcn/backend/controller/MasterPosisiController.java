package com.shadcn.backend.controller;

import com.shadcn.backend.dto.MasterPosisiRequest;
import com.shadcn.backend.dto.MasterPosisiResponse;
import com.shadcn.backend.service.MasterPosisiService;
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
@RequestMapping("/api/admin/master-data/posisi")
@RequiredArgsConstructor
@Slf4j
public class MasterPosisiController {
    
    private final MasterPosisiService service;    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Page<MasterPosisiResponse>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String kategori,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        log.info("GET /api/admin/master-data/posisi - search: {}, kategori: {}, isActive: {}, page: {}, size: {}", 
                search, kategori, isActive, page, size);
        
        Page<MasterPosisiResponse> result = service.findAll(search, kategori, isActive, page, size);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<MasterPosisiResponse>> findAllActive() {
        log.info("GET /api/admin/master-data/posisi/active");
        List<MasterPosisiResponse> result = service.findAllActive();
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/category/{kategori}")
    public ResponseEntity<List<MasterPosisiResponse>> findByCategory(@PathVariable String kategori) {
        log.info("GET /api/admin/master-data/posisi/category/{}", kategori);
        List<MasterPosisiResponse> result = service.findByCategory(kategori);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/categories")
    public ResponseEntity<List<String>> findAllCategories() {
        log.info("GET /api/admin/master-data/posisi/categories");
        List<String> result = service.findAllCategories();
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterPosisiResponse> findById(@PathVariable Long id) {
        log.info("GET /api/admin/master-data/posisi/{}", id);
        MasterPosisiResponse result = service.findById(id);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterPosisiResponse> create(@Valid @RequestBody MasterPosisiRequest request) {
        log.info("POST /api/admin/master-data/posisi - {}", request);
        MasterPosisiResponse result = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterPosisiResponse> update(@PathVariable Long id, @Valid @RequestBody MasterPosisiRequest request) {
        log.info("PUT /api/admin/master-data/posisi/{} - {}", id, request);
        MasterPosisiResponse result = service.update(id, request);
        return ResponseEntity.ok(result);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("DELETE /api/admin/master-data/posisi/{}", id);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterPosisiResponse> toggleActive(@PathVariable Long id) {
        log.info("PATCH /api/admin/master-data/posisi/{}/toggle-active", id);
        MasterPosisiResponse result = service.toggleActive(id);
        return ResponseEntity.ok(result);
    }
}
