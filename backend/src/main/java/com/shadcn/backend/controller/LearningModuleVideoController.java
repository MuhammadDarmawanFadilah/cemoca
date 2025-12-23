package com.shadcn.backend.controller;

import com.shadcn.backend.dto.LearningModuleVideoRequest;
import com.shadcn.backend.dto.LearningModuleVideoResponse;
import com.shadcn.backend.service.LearningModuleVideoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/learning-module/videos")
public class LearningModuleVideoController {

    @Autowired
    private LearningModuleVideoService service;

    @GetMapping
    public ResponseEntity<Page<LearningModuleVideoResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String companyName,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String duration,
            @RequestParam(required = false) String creator,
            @RequestParam(required = false) String audience,
            @RequestParam(required = false) String contentType
    ) {
        Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortProp = mapSortProperty(sortBy);
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sortProp));
        return ResponseEntity.ok(service.list(pageable, category, companyName, title, duration, creator, audience, contentType));
    }

    private String mapSortProperty(String property) {
        if (property == null) return "created_at";
        switch (property) {
            case "createdAt": return "created_at";
            case "updatedAt": return "updated_at";
            case "createdByCompanyName": return "created_by_company_name";
            case "shareScope": return "share_scope";
            case "title": return "title";
            case "duration": return "duration";
            case "code": return "code";
            default: return "created_at";
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<LearningModuleVideoResponse> getById(
            @PathVariable Long id,
            @RequestParam(required = false) String companyName
    ) {
        Optional<LearningModuleVideoResponse> res = service.getById(id, companyName);
        return res.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody LearningModuleVideoRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody LearningModuleVideoRequest request,
            @RequestParam(required = false) String companyName
    ) {
        try {
            Optional<LearningModuleVideoResponse> res = service.update(id, request, companyName);
            return res.<ResponseEntity<?>>map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id,
            @RequestParam(required = false) String companyName
    ) {
        try {
            boolean deleted = service.delete(id, companyName);
            if (!deleted) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.noContent().build();
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
        }
    }
}
