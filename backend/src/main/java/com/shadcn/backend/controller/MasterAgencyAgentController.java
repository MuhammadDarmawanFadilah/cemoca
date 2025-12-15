package com.shadcn.backend.controller;

import java.nio.charset.StandardCharsets;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.shadcn.backend.dto.MasterAgencyAgentApiImportRequest;
import com.shadcn.backend.dto.MasterAgencyAgentImportResult;
import com.shadcn.backend.dto.MasterAgencyAgentRequest;
import com.shadcn.backend.dto.MasterAgencyAgentResponse;
import com.shadcn.backend.service.MasterAgencyAgentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/admin/master-data/agency-list")
@RequiredArgsConstructor
@Slf4j
public class MasterAgencyAgentController {

    private final MasterAgencyAgentService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<Page<MasterAgencyAgentResponse>> findAll(
            @RequestParam String companyCode,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) String phoneNo,
            @RequestParam(required = false) String rankCode,
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Page<MasterAgencyAgentResponse> result = service.findAll(companyCode, search, fullName, phoneNo, rankCode, createdBy, isActive, page, size, sortBy, sortDir);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<MasterAgencyAgentResponse> findById(
            @RequestParam String companyCode,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(service.findById(companyCode, id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<MasterAgencyAgentResponse> create(
            @RequestParam String companyCode,
            @Valid @RequestBody MasterAgencyAgentRequest request
    ) {
        MasterAgencyAgentResponse result = service.create(companyCode, request, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<MasterAgencyAgentResponse> update(
            @RequestParam String companyCode,
            @PathVariable Long id,
            @Valid @RequestBody MasterAgencyAgentRequest request
    ) {
        return ResponseEntity.ok(service.update(companyCode, id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<Void> delete(
            @RequestParam String companyCode,
            @PathVariable Long id
    ) {
        service.delete(companyCode, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<MasterAgencyAgentResponse> toggleActive(
            @RequestParam String companyCode,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(service.toggleActive(companyCode, id));
    }

    @PostMapping("/import-excel")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<MasterAgencyAgentImportResult> importExcel(
            @RequestParam String companyCode,
            @RequestParam(defaultValue = "false") boolean removeExisting,
            @RequestParam("file") MultipartFile file
    ) {
        MasterAgencyAgentImportResult result = service.importExcel(companyCode, file, removeExisting, null);
        if (result.success()) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }

    @PostMapping("/import-api")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<MasterAgencyAgentImportResult> importApi(
            @Valid @RequestBody MasterAgencyAgentApiImportRequest request
    ) {
        boolean removeExisting = Boolean.TRUE.equals(request.getRemoveExisting());
        MasterAgencyAgentImportResult result = service.importApi(request.getCompanyCode(), request.getItems(), removeExisting, request.getCompanyName());
        if (result.success()) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }

    @PostMapping("/import-csv")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<MasterAgencyAgentImportResult> importCsv(
            @RequestParam String companyCode,
            @RequestParam(defaultValue = "false") boolean removeExisting,
            @RequestParam("file") MultipartFile file
    ) {
        MasterAgencyAgentImportResult result = service.importCsv(companyCode, file, removeExisting, null);
        if (result.success()) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }

    @GetMapping("/template-excel")
    public ResponseEntity<byte[]> templateExcel() {
        byte[] bytes = service.buildExcelTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=agency_list_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @GetMapping("/template-csv")
    public ResponseEntity<byte[]> templateCsv() {
        String csv = service.buildCsvTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=agency_list_template.csv")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv.getBytes(StandardCharsets.UTF_8));
    }

}
