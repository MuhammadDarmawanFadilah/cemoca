package com.shadcn.backend.controller;

import com.shadcn.backend.dto.MasterPolicySalesApiImportRequest;
import com.shadcn.backend.dto.MasterPolicySalesImportResult;
import com.shadcn.backend.dto.MasterPolicySalesRequest;
import com.shadcn.backend.dto.MasterPolicySalesResponse;
import com.shadcn.backend.service.MasterPolicySalesService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/admin/master-data/policy-sales")
@RequiredArgsConstructor
@Slf4j
public class MasterPolicySalesController {

    private final MasterPolicySalesService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<Page<MasterPolicySalesResponse>> findAll(
            @RequestParam String companyCode,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String agentCode,
            @RequestParam(required = false) String createdBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Page<MasterPolicySalesResponse> result = service.findAll(companyCode, search, agentCode, createdBy, page, size, sortBy, sortDir);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<MasterPolicySalesResponse> findById(
            @RequestParam String companyCode,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(service.findById(companyCode, id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<MasterPolicySalesResponse> create(
            @RequestParam String companyCode,
            @Valid @RequestBody MasterPolicySalesRequest request
    ) {
        MasterPolicySalesResponse result = service.create(companyCode, request, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<MasterPolicySalesResponse> update(
            @RequestParam String companyCode,
            @PathVariable Long id,
            @Valid @RequestBody MasterPolicySalesRequest request
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

    @PostMapping("/import-excel")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<MasterPolicySalesImportResult> importExcel(
            @RequestParam String companyCode,
            @RequestParam(defaultValue = "false") boolean removeExisting,
            @RequestParam("file") MultipartFile file
    ) {
        MasterPolicySalesImportResult result = service.importExcel(companyCode, file, removeExisting, null);
        if (result.success()) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }

    @PostMapping("/import-csv")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<MasterPolicySalesImportResult> importCsv(
            @RequestParam String companyCode,
            @RequestParam(defaultValue = "false") boolean removeExisting,
            @RequestParam("file") MultipartFile file
    ) {
        MasterPolicySalesImportResult result = service.importCsv(companyCode, file, removeExisting, null);
        if (result.success()) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }

    @PostMapping("/import-api")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<MasterPolicySalesImportResult> importApi(
            @Valid @RequestBody MasterPolicySalesApiImportRequest request
    ) {
        boolean removeExisting = Boolean.TRUE.equals(request.getRemoveExisting());
        MasterPolicySalesImportResult result = service.importApi(request.getCompanyCode(), request.getItems(), removeExisting, request.getCompanyName());
        if (result.success()) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }

    @GetMapping("/template-excel")
    public ResponseEntity<byte[]> templateExcel() {
        byte[] bytes = service.buildExcelTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=policy_sales_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @GetMapping("/template-csv")
    public ResponseEntity<byte[]> templateCsv() {
        String csv = service.buildCsvTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=policy_sales_template.csv")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv.getBytes(StandardCharsets.UTF_8));
    }
}
