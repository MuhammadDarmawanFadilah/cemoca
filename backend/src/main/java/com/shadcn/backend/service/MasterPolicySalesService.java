package com.shadcn.backend.service;

import com.shadcn.backend.dto.MasterPolicySalesImportError;
import com.shadcn.backend.dto.MasterPolicySalesImportResult;
import com.shadcn.backend.dto.MasterPolicySalesRequest;
import com.shadcn.backend.dto.MasterPolicySalesResponse;
import com.shadcn.backend.exception.ResourceNotFoundException;
import com.shadcn.backend.exception.ValidationException;
import com.shadcn.backend.model.MasterPolicySales;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.MasterPolicySalesRepository;
import com.shadcn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class MasterPolicySalesService {

    private final MasterPolicySalesRepository repository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<MasterPolicySalesResponse> findAll(
            String companyCode,
            String search,
            String agentCode,
            String createdBy,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {
        String normalizedCompanyCode = normalizeString(companyCode);
        if (normalizedCompanyCode == null) {
            throw new ValidationException("Company Code wajib diisi");
        }

        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(direction, sortBy == null || sortBy.isBlank() ? "createdAt" : sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        String fAgentCode = normalizeSearch(agentCode);
        String fCreatedBy = normalizeSearch(createdBy);

        boolean hasColumnFilters = fAgentCode != null || fCreatedBy != null;
        if (hasColumnFilters) {
            return repository.findWithColumnFilters(normalizedCompanyCode, fAgentCode, fCreatedBy, pageable)
                    .map(this::toResponse);
        }

        return repository.findWithFilters(normalizedCompanyCode, normalizeSearch(search), pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public MasterPolicySalesResponse findById(String companyCode, Long id) {
        String normalizedCompanyCode = normalizeString(companyCode);
        if (normalizedCompanyCode == null) {
            throw new ValidationException("Company Code wajib diisi");
        }

        MasterPolicySales entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data policy sales dengan ID " + id + " tidak ditemukan"));

        if (!normalizedCompanyCode.equalsIgnoreCase(entity.getCompanyCode())) {
            throw new ResourceNotFoundException("Data policy sales dengan ID " + id + " tidak ditemukan");
        }

        return toResponse(entity);
    }

    @Transactional
    public MasterPolicySalesResponse create(String companyCode, MasterPolicySalesRequest request, String createdBy) {
        String normalizedCompanyCode = normalizeString(companyCode);
        if (normalizedCompanyCode == null) {
            throw new ValidationException("Company Code wajib diisi");
        }

        MasterPolicySales entity = new MasterPolicySales();
        applyRequest(entity, request);
        entity.setCompanyCode(normalizedCompanyCode);
        entity.setCreatedBy(resolveCreatedByForCompany(normalizedCompanyCode, createdBy));

        MasterPolicySales saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public MasterPolicySalesResponse update(String companyCode, Long id, MasterPolicySalesRequest request) {
        String normalizedCompanyCode = normalizeString(companyCode);
        if (normalizedCompanyCode == null) {
            throw new ValidationException("Company Code wajib diisi");
        }

        MasterPolicySales existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data policy sales dengan ID " + id + " tidak ditemukan"));

        if (!normalizedCompanyCode.equalsIgnoreCase(existing.getCompanyCode())) {
            throw new ResourceNotFoundException("Data policy sales dengan ID " + id + " tidak ditemukan");
        }

        applyRequest(existing, request);
        existing.setCompanyCode(normalizedCompanyCode);

        MasterPolicySales saved = repository.save(existing);
        return toResponse(saved);
    }

    @Transactional
    public void delete(String companyCode, Long id) {
        String normalizedCompanyCode = normalizeString(companyCode);
        if (normalizedCompanyCode == null) {
            throw new ValidationException("Company Code wajib diisi");
        }

        MasterPolicySales existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data policy sales dengan ID " + id + " tidak ditemukan"));

        if (!normalizedCompanyCode.equalsIgnoreCase(existing.getCompanyCode())) {
            throw new ResourceNotFoundException("Data policy sales dengan ID " + id + " tidak ditemukan");
        }

        repository.deleteById(id);
    }

    @Transactional
    public MasterPolicySalesImportResult importExcel(String companyCode, MultipartFile file, boolean removeExisting, String createdBy) {
        String normalizedCompanyCode = normalizeString(companyCode);
        if (normalizedCompanyCode == null) {
            return new MasterPolicySalesImportResult(false, 0, 0, List.of(
                    new MasterPolicySalesImportError(0, "Company Code", "Wajib diisi", companyCode)
            ));
        }

        if (file == null || file.isEmpty()) {
            return new MasterPolicySalesImportResult(false, 0, 0, List.of(
                    new MasterPolicySalesImportError(0, "file", "File kosong", null)
            ));
        }

        String normalizedCreatedBy = resolveCreatedByForCompany(normalizedCompanyCode, createdBy);

        List<MasterPolicySalesImportError> errors = new ArrayList<>();
        int created = 0;
        int updated = 0;

        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) {
                return new MasterPolicySalesImportResult(false, 0, 0, List.of(
                        new MasterPolicySalesImportError(0, "file", "Sheet tidak ditemukan", null)
                ));
            }

            DataFormatter formatter = new DataFormatter();
            int lastRow = sheet.getLastRowNum();
            if (lastRow < 1) {
                if (removeExisting) {
                    repository.deleteByCompanyCode(normalizedCompanyCode);
                    repository.flush();
                    return new MasterPolicySalesImportResult(true, 0, 0, List.of());
                }
                return new MasterPolicySalesImportResult(true, 0, 0, List.of());
            }

            if (removeExisting) {
                repository.deleteByCompanyCode(normalizedCompanyCode);
                repository.flush();
            }

            Set<String> seenRowHashes = new HashSet<>();

            for (int r = 1; r <= lastRow; r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                int rowNumber = r + 1;

                String agentCode = readString(formatter, row.getCell(1));
                LocalDate policyDate = readLocalDate(row.getCell(2), formatter, errors, rowNumber, "Policy Date");
                BigDecimal policyFyp = readDecimal(row.getCell(3), formatter, errors, rowNumber, "Policy FYP");
                BigDecimal policyApe = readDecimal(row.getCell(4), formatter, errors, rowNumber, "Policy APE");

                if (isAllBlank(agentCode) && policyDate == null && policyFyp == null && policyApe == null) {
                    continue;
                }

                if (isBlank(agentCode)) {
                    errors.add(new MasterPolicySalesImportError(rowNumber, "Agent Code", "Wajib diisi", null));
                    continue;
                }
                if (policyDate == null) {
                    errors.add(new MasterPolicySalesImportError(rowNumber, "Policy Date", "Wajib diisi", null));
                    continue;
                }
                if (policyFyp == null) {
                    errors.add(new MasterPolicySalesImportError(rowNumber, "Policy FYP", "Wajib diisi", null));
                    continue;
                }
                if (policyApe == null) {
                    errors.add(new MasterPolicySalesImportError(rowNumber, "Policy APE", "Wajib diisi", null));
                    continue;
                }

                String rowHash = (agentCode.trim().toLowerCase(Locale.ROOT) + "|" + policyDate + "|" + policyFyp + "|" + policyApe);
                if (!seenRowHashes.add(rowHash)) {
                    errors.add(new MasterPolicySalesImportError(rowNumber, "Row", "Duplikat dalam file", agentCode));
                    continue;
                }

                MasterPolicySales entity = new MasterPolicySales();
                entity.setCompanyCode(normalizedCompanyCode);
                entity.setCreatedBy(normalizedCreatedBy);
                entity.setAgentCode(agentCode.trim());
                entity.setPolicyDate(policyDate);
                entity.setPolicyFyp(policyFyp);
                entity.setPolicyApe(policyApe);
                repository.save(entity);
                created++;
            }
        } catch (Exception e) {
            log.error("Error import excel policy sales", e);
            throw new RuntimeException("Error import excel policy sales: " + (e.getMessage() == null ? "Unknown error" : e.getMessage()), e);
        }

        boolean success = errors.isEmpty();
        return new MasterPolicySalesImportResult(success, created, updated, errors);
    }

    @Transactional
    public MasterPolicySalesImportResult importCsv(String companyCode, MultipartFile file, boolean removeExisting, String createdBy) {
        String normalizedCompanyCode = normalizeString(companyCode);
        if (normalizedCompanyCode == null) {
            return new MasterPolicySalesImportResult(false, 0, 0, List.of(
                    new MasterPolicySalesImportError(0, "Company Code", "Wajib diisi", companyCode)
            ));
        }

        if (file == null || file.isEmpty()) {
            return new MasterPolicySalesImportResult(false, 0, 0, List.of(
                    new MasterPolicySalesImportError(0, "file", "File kosong", null)
            ));
        }

        String normalizedCreatedBy = resolveCreatedByForCompany(normalizedCompanyCode, createdBy);

        List<MasterPolicySalesImportError> errors = new ArrayList<>();
        int created = 0;
        int updated = 0;

        try {
            if (removeExisting) {
                repository.deleteByCompanyCode(normalizedCompanyCode);
                repository.flush();
            }

            Set<String> seenRowHashes = new HashSet<>();

            try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                int rowNumber = 0;

                while ((line = br.readLine()) != null) {
                    rowNumber++;
                    if (rowNumber == 1) {
                        continue;
                    }
                    if (line.trim().isEmpty()) {
                        continue;
                    }

                    List<String> cols = parseCsvLine(line);

                    String agentCode = getCsv(cols, 1);
                    String policyDateRaw = getCsv(cols, 2);
                    String policyFypRaw = getCsv(cols, 3);
                    String policyApeRaw = getCsv(cols, 4);

                    LocalDate policyDate = parseCsvDate(policyDateRaw, errors, rowNumber, "Policy Date");

                    BigDecimal policyFyp = parseCsvDecimal(policyFypRaw, errors, rowNumber, "Policy FYP");
                    BigDecimal policyApe = parseCsvDecimal(policyApeRaw, errors, rowNumber, "Policy APE");

                    if (isAllBlank(agentCode, policyDateRaw, policyFypRaw, policyApeRaw)) {
                        continue;
                    }

                    if (isBlank(agentCode)) {
                        errors.add(new MasterPolicySalesImportError(rowNumber, "Agent Code", "Wajib diisi", agentCode));
                        continue;
                    }
                    if (policyDate == null) {
                        errors.add(new MasterPolicySalesImportError(rowNumber, "Policy Date", "Wajib diisi", policyDateRaw));
                        continue;
                    }
                    if (policyFyp == null) {
                        errors.add(new MasterPolicySalesImportError(rowNumber, "Policy FYP", "Wajib diisi", policyFypRaw));
                        continue;
                    }
                    if (policyApe == null) {
                        errors.add(new MasterPolicySalesImportError(rowNumber, "Policy APE", "Wajib diisi", policyApeRaw));
                        continue;
                    }

                    String rowHash = (agentCode.trim().toLowerCase(Locale.ROOT) + "|" + policyDate + "|" + policyFyp + "|" + policyApe);
                    if (!seenRowHashes.add(rowHash)) {
                        errors.add(new MasterPolicySalesImportError(rowNumber, "Row", "Duplikat dalam file", agentCode));
                        continue;
                    }

                    MasterPolicySales entity = new MasterPolicySales();
                    entity.setCompanyCode(normalizedCompanyCode);
                    entity.setCreatedBy(normalizedCreatedBy);
                    entity.setAgentCode(agentCode);
                    entity.setPolicyDate(policyDate);
                    entity.setPolicyFyp(policyFyp);
                    entity.setPolicyApe(policyApe);
                    repository.save(entity);
                    created++;
                }
            }
        } catch (IOException e) {
            log.error("Error import csv policy sales", e);
            throw new RuntimeException("Error import csv policy sales: " + (e.getMessage() == null ? "Unknown error" : e.getMessage()), e);
        } catch (RuntimeException e) {
            log.error("Error import csv policy sales", e);
            throw new RuntimeException("Error import csv policy sales: " + (e.getMessage() == null ? "Unknown error" : e.getMessage()), e);
        }

        boolean success = errors.isEmpty();
        return new MasterPolicySalesImportResult(success, created, updated, errors);
    }

    @Transactional
    public MasterPolicySalesImportResult importApi(String companyCode, List<MasterPolicySalesRequest> items, boolean removeExisting, String companyName) {
        String normalizedCompanyCode = normalizeString(companyCode);
        if (normalizedCompanyCode == null) {
            return new MasterPolicySalesImportResult(false, 0, 0, List.of(
                    new MasterPolicySalesImportError(0, "Company Code", "Wajib diisi", companyCode)
            ));
        }

        String normalizedCreatedBy = resolveCreatedByForCompany(normalizedCompanyCode, companyName);

        if (items == null || items.isEmpty()) {
            return new MasterPolicySalesImportResult(false, 0, 0, List.of(
                    new MasterPolicySalesImportError(0, "items", "Tidak ada data", null)
            ));
        }

        if (removeExisting) {
            repository.deleteByCompanyCode(normalizedCompanyCode);
            repository.flush();
        }

        List<MasterPolicySalesImportError> errors = new ArrayList<>();
        int created = 0;
        int updated = 0;

        Set<String> seenRowHashes = new HashSet<>();

        for (int i = 0; i < items.size(); i++) {
            MasterPolicySalesRequest item = items.get(i);
            int rowNumber = i + 1;

            String agentCode = item == null ? null : normalizeString(item.getAgentCode());
            LocalDate policyDate = item == null ? null : item.getPolicyDate();
            BigDecimal policyFyp = item == null ? null : item.getPolicyFyp();
            BigDecimal policyApe = item == null ? null : item.getPolicyApe();

            if (agentCode == null || agentCode.isBlank()) {
                errors.add(new MasterPolicySalesImportError(rowNumber, "Agent Code", "Wajib diisi", null));
                continue;
            }
            if (policyDate == null) {
                errors.add(new MasterPolicySalesImportError(rowNumber, "Policy Date", "Wajib diisi", null));
                continue;
            }
            if (policyFyp == null) {
                errors.add(new MasterPolicySalesImportError(rowNumber, "Policy FYP", "Wajib diisi", null));
                continue;
            }
            if (policyApe == null) {
                errors.add(new MasterPolicySalesImportError(rowNumber, "Policy APE", "Wajib diisi", null));
                continue;
            }

            String agentCodeKey = java.util.Objects.requireNonNull(agentCode);
            String rowHash = (agentCodeKey.toLowerCase(Locale.ROOT) + "|" + policyDate + "|" + policyFyp + "|" + policyApe);
            if (!seenRowHashes.add(rowHash)) {
                errors.add(new MasterPolicySalesImportError(rowNumber, "Row", "Duplikat dalam request", agentCodeKey));
                continue;
            }

            MasterPolicySales entity = new MasterPolicySales();
            entity.setCompanyCode(normalizedCompanyCode);
            entity.setCreatedBy(normalizedCreatedBy);
            entity.setAgentCode(agentCodeKey);
            entity.setPolicyDate(policyDate);
            entity.setPolicyFyp(policyFyp);
            entity.setPolicyApe(policyApe);
            repository.save(entity);
            created++;
        }

        boolean success = errors.isEmpty();
        return new MasterPolicySalesImportResult(success, created, updated, errors);
    }

    public byte[] buildExcelTemplate() {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Policy Sales");

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);

            Row header = sheet.createRow(0);
            createCell(header, 0, "No", headerStyle);
            createCell(header, 1, "Agent Code*", headerStyle);
            createCell(header, 2, "Policy Date*", headerStyle);
            createCell(header, 3, "Policy FYP*", headerStyle);
            createCell(header, 4, "Policy APE*", headerStyle);

            Row example = sheet.createRow(1);
            example.createCell(0).setCellValue(1);
            example.createCell(1).setCellValue("AG-001");
            example.createCell(2).setCellValue("2025-01-15");
            example.createCell(3).setCellValue("12345.67");
            example.createCell(4).setCellValue("12345.67");

            for (int i = 0; i <= 4; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(bos);
            return bos.toByteArray();
        } catch (Exception e) {
            log.error("Error build excel template policy sales", e);
            throw new RuntimeException("Gagal membuat template excel", e);
        }
    }

    public String buildCsvTemplate() {
        return String.join("\n",
                "No,Agent Code*,Policy Date*,Policy FYP*,Policy APE*",
                "1,AG-001,2025-01-15,12345.67,12345.67"
        );
    }

    private void createCell(Row row, int idx, String value, CellStyle style) {
        Cell cell = row.createCell(idx);
        cell.setCellValue(value);
        if (style != null) {
            cell.setCellStyle(style);
        }
    }

    private void applyRequest(MasterPolicySales entity, MasterPolicySalesRequest request) {
        if (request == null) {
            throw new ValidationException("Request tidak valid");
        }

        String agentCode = normalizeString(request.getAgentCode());
        LocalDate policyDate = request.getPolicyDate();
        BigDecimal policyFyp = request.getPolicyFyp();
        BigDecimal policyApe = request.getPolicyApe();

        if (agentCode == null) {
            throw new ValidationException("Agent Code wajib diisi");
        }
        if (policyDate == null) {
            throw new ValidationException("Policy Date wajib diisi");
        }
        if (policyFyp == null) {
            throw new ValidationException("Policy FYP wajib diisi");
        }
        if (policyApe == null) {
            throw new ValidationException("Policy APE wajib diisi");
        }

        entity.setAgentCode(agentCode);
        entity.setPolicyDate(policyDate);
        entity.setPolicyFyp(policyFyp);
        entity.setPolicyApe(policyApe);
    }

    private MasterPolicySalesResponse toResponse(MasterPolicySales entity) {
        return new MasterPolicySalesResponse(
                entity.getId(),
                entity.getAgentCode(),
                entity.getPolicyDate(),
                entity.getPolicyFyp(),
                entity.getPolicyApe(),
                entity.getCreatedBy(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private LocalDate readLocalDate(Cell cell, DataFormatter formatter, List<MasterPolicySalesImportError> errors, int rowNumber, String column) {
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC && org.apache.poi.ss.usermodel.DateUtil.isCellDateFormatted(cell)) {
                return cell.getLocalDateTimeCellValue().toLocalDate();
            }

            String raw = formatter.formatCellValue(cell);
            if (raw == null) return null;
            String v = raw.trim();
            if (v.isEmpty()) return null;
            return parseDateFlexible(v);
        } catch (Exception ex) {
            String raw = null;
            try {
                raw = formatter.formatCellValue(cell);
            } catch (Exception ignored) {
            }
            errors.add(new MasterPolicySalesImportError(rowNumber, column, "Format tanggal tidak valid", raw));
            return null;
        }
    }

    private LocalDate parseCsvDate(String raw, List<MasterPolicySalesImportError> errors, int rowNumber, String column) {
        String v = normalizeString(raw);
        if (v == null) return null;
        try {
            return parseDateFlexible(v);
        } catch (Exception ex) {
            errors.add(new MasterPolicySalesImportError(rowNumber, column, "Format tanggal tidak valid", raw));
            return null;
        }
    }

    private LocalDate parseDateFlexible(String raw) {
        String v = raw.trim();
        if (v.isEmpty()) return null;

        List<DateTimeFormatter> formatters = List.of(
                DateTimeFormatter.ISO_LOCAL_DATE,
                new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("d/M/uuuu").toFormatter(),
                new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("d-M-uuuu").toFormatter(),
                new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("uuuu/M/d").toFormatter(),
                new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("uuuu-M-d").toFormatter()
        );

        for (DateTimeFormatter f : formatters) {
            try {
                return LocalDate.parse(v, f);
            } catch (DateTimeParseException ignored) {
            }
        }
        throw new DateTimeParseException("Unparseable date", v, 0);
    }

    private String normalizeSearch(String raw) {
        if (raw == null) return null;
        String v = raw.trim();
        if (v.isEmpty()) return null;
        return v;
    }

    private String normalizeString(String raw) {
        if (raw == null) return null;
        String v = raw.trim();
        return v.isEmpty() ? null : v;
    }

    private String resolveCreatedByForCompany(String normalizedCompanyCode, String providedCompanyName) {
        String provided = normalizeString(providedCompanyName);
        if (provided != null) {
            return provided;
        }
        try {
            User u = userRepository.findTopByCompanyCodeIgnoreCase(normalizedCompanyCode).orElse(null);
            if (u != null) {
                String cn = normalizeString(u.getCompanyName());
                if (cn != null) {
                    return cn;
                }
            }
        } catch (Exception ignored) {
        }
        if (normalizedCompanyCode != null) {
            return normalizedCompanyCode;
        }
        return "SYSTEM";
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private boolean isAllBlank(String... items) {
        for (String s : items) {
            if (!isBlank(s)) return false;
        }
        return true;
    }

    private String readString(DataFormatter formatter, Cell cell) {
        if (cell == null) return null;
        String s = formatter.formatCellValue(cell);
        if (s == null) return null;
        String v = s.trim();
        return v.isEmpty() ? null : v;
    }

    private BigDecimal readDecimal(Cell cell, DataFormatter formatter, List<MasterPolicySalesImportError> errors, int rowNumber, String column) {
        if (cell == null) return null;
        String raw = null;
        try {
            raw = formatter.formatCellValue(cell);
            if (raw == null) return null;
            String v = raw.trim();
            if (v.isEmpty()) return null;
            return parseDecimalFlexible(v);
        } catch (NumberFormatException ex) {
            errors.add(new MasterPolicySalesImportError(rowNumber, column, "Format angka tidak valid", raw));
            return null;
        } catch (Exception ex) {
            errors.add(new MasterPolicySalesImportError(rowNumber, column, ex.getMessage(), raw));
            return null;
        }
    }

    private BigDecimal parseCsvDecimal(String raw, List<MasterPolicySalesImportError> errors, int rowNumber, String column) {
        String v = normalizeString(raw);
        if (v == null) return null;
        try {
            return parseDecimalFlexible(v);
        } catch (NumberFormatException ex) {
            errors.add(new MasterPolicySalesImportError(rowNumber, column, "Format angka tidak valid", raw));
            return null;
        } catch (Exception ex) {
            errors.add(new MasterPolicySalesImportError(rowNumber, column, ex.getMessage(), raw));
            return null;
        }
    }

    private BigDecimal parseDecimalFlexible(String raw) {
        String v = raw.trim();
        if (v.isEmpty()) {
            return null;
        }

        v = v.replace(" ", "");
        v = v.replaceAll("[^0-9,\\.\\-]", "");

        boolean hasComma = v.contains(",");
        boolean hasDot = v.contains(".");

        if (hasComma && hasDot) {
            v = v.replace(",", "");
        } else if (hasComma) {
            v = v.replace(",", ".");
        }

        BigDecimal bd = new BigDecimal(v);
        return bd.setScale(2, RoundingMode.HALF_UP);
    }

    private String getCsv(List<String> cols, int idx) {
        if (cols == null) return null;
        if (idx < 0 || idx >= cols.size()) return null;
        return normalizeString(cols.get(idx));
    }

    private List<String> parseCsvLine(String line) {
        List<String> out = new ArrayList<>();
        if (line == null) return out;

        StringBuilder cur = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (ch == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    cur.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch == ',' && !inQuotes) {
                out.add(cur.toString());
                cur.setLength(0);
            } else {
                cur.append(ch);
            }
        }
        out.add(cur.toString());
        return out;
    }
}
