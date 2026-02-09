package com.shadcn.backend.controller;

import com.shadcn.backend.dto.CertificateTemplateRequest;
import com.shadcn.backend.dto.CertificateTemplateResponse;
import com.shadcn.backend.service.CertificateTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/certification/certificate-templates")
@RequiredArgsConstructor
@Slf4j
public class CertificateTemplateController {
    
    private final CertificateTemplateService service;
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Page<CertificateTemplateResponse>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        log.info("GET /api/certification/certificate-templates - search: {}, isActive: {}, page: {}, size: {}", 
                search, isActive, page, size);
        
        Page<CertificateTemplateResponse> result = service.findAll(search, isActive, page, size);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<CertificateTemplateResponse>> findAllActive() {
        log.info("GET /api/certification/certificate-templates/active");
        List<CertificateTemplateResponse> result = service.findAllActive();
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/generate-code")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Map<String, String>> generateCode(@RequestParam(defaultValue = "AC") String prefix) {
        log.info("GET /api/certification/certificate-templates/generate-code - prefix: {}", prefix);
        String code = service.generateTemplateCode(prefix);
        Map<String, String> response = new HashMap<>();
        response.put("templateCode", code);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<CertificateTemplateResponse> findById(@PathVariable Long id) {
        log.info("GET /api/certification/certificate-templates/{}", id);
        CertificateTemplateResponse result = service.findById(id);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/by-code/{templateCode}")
    public ResponseEntity<CertificateTemplateResponse> findByTemplateCode(@PathVariable String templateCode) {
        log.info("GET /api/certification/certificate-templates/by-code/{}", templateCode);
        CertificateTemplateResponse result = service.findByTemplateCode(templateCode);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<CertificateTemplateResponse> create(@Valid @RequestBody CertificateTemplateRequest request) {
        log.info("POST /api/certification/certificate-templates - {}", request);
        CertificateTemplateResponse result = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<CertificateTemplateResponse> update(@PathVariable Long id, @Valid @RequestBody CertificateTemplateRequest request) {
        log.info("PUT /api/certification/certificate-templates/{} - {}", id, request);
        CertificateTemplateResponse result = service.update(id, request);
        return ResponseEntity.ok(result);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("DELETE /api/certification/certificate-templates/{}", id);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<CertificateTemplateResponse> toggleActive(@PathVariable Long id) {
        log.info("PATCH /api/certification/certificate-templates/{}/toggle-active", id);
        CertificateTemplateResponse result = service.toggleActive(id);
        return ResponseEntity.ok(result);
    }
}
