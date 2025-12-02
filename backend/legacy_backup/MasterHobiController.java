package com.shadcn.backend.controller;

import com.shadcn.backend.dto.MasterHobiRequest;
import com.shadcn.backend.dto.MasterHobiResponse;
import com.shadcn.backend.service.MasterHobiService;
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
@RequestMapping("/api/admin/master-data/hobi")
@RequiredArgsConstructor
@Slf4j
public class MasterHobiController {
    
    private final MasterHobiService service;    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Page<MasterHobiResponse>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String kategori,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        log.info("GET /api/admin/master-data/hobi - search: {}, kategori: {}, isActive: {}, page: {}, size: {}", 
                search, kategori, isActive, page, size);
        
        Page<MasterHobiResponse> result = service.findAll(search, kategori, isActive, page, size);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<MasterHobiResponse>> findAllActive() {
        log.info("GET /api/admin/master-data/hobi/active");
        List<MasterHobiResponse> result = service.findAllActive();
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/category/{kategori}")
    public ResponseEntity<List<MasterHobiResponse>> findByCategory(@PathVariable String kategori) {
        log.info("GET /api/admin/master-data/hobi/category/{}", kategori);
        List<MasterHobiResponse> result = service.findByCategory(kategori);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/categories")
    public ResponseEntity<List<String>> findAllCategories() {
        log.info("GET /api/admin/master-data/hobi/categories");
        List<String> result = service.findAllCategories();
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterHobiResponse> findById(@PathVariable Long id) {
        log.info("GET /api/admin/master-data/hobi/{}", id);
        MasterHobiResponse result = service.findById(id);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterHobiResponse> create(@Valid @RequestBody MasterHobiRequest request) {
        log.info("POST /api/admin/master-data/hobi - {}", request);
        MasterHobiResponse result = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterHobiResponse> update(@PathVariable Long id, @Valid @RequestBody MasterHobiRequest request) {
        log.info("PUT /api/admin/master-data/hobi/{} - {}", id, request);
        MasterHobiResponse result = service.update(id, request);
        return ResponseEntity.ok(result);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("DELETE /api/admin/master-data/hobi/{}", id);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<MasterHobiResponse> toggleActive(@PathVariable Long id) {
        log.info("PATCH /api/admin/master-data/hobi/{}/toggle-active", id);
        MasterHobiResponse result = service.toggleActive(id);
        return ResponseEntity.ok(result);
    }
}
