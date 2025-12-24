package com.shadcn.backend.service;

import com.shadcn.backend.dto.ExcelValidationResult;
import com.shadcn.backend.dto.ExcelValidationResult.ExcelRow;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.regex.Pattern;
import java.math.BigDecimal;

@Service
public class ExcelService {
    private static final Logger logger = LoggerFactory.getLogger(ExcelService.class);
    
    // Indonesian phone regex - starts with 08 or +628 or 628
    private static final Pattern PHONE_PATTERN = Pattern.compile("^(\\+62|62|0)8[1-9][0-9]{7,10}$");
    
    private final DIDService didService;

    public ExcelService(DIDService didService) {
        this.didService = didService;
    }

    /**
     * Parse and validate Excel file
     * Expected columns: no, avatar (name), phone, name
     * Avatar validation: 
     * 1. First check database for existing avatar
     * 2. If not found, refresh from D-ID API
     * 3. If still not found, mark as error
     */
    public ExcelValidationResult parseAndValidateExcel(MultipartFile file) {
        ExcelValidationResult result = new ExcelValidationResult();
        List<String> errors = new ArrayList<>();
        List<ExcelRow> rows = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {
            
            Sheet sheet = workbook.getSheetAt(0);

            HeaderDetection headerDetection = detectHeader(sheet, Set.of("avatar", "phone", "name"));
            if (headerDetection == null || headerDetection.columnMap.isEmpty()) {
                errors.add("File Excel kosong atau tidak memiliki header");
                result.setValid(false);
                result.setErrors(errors);
                result.setRows(rows);
                return result;
            }

            Map<String, Integer> columnMap = validateHeaders(headerDetection.columnMap, errors);
            if (!errors.isEmpty()) {
                result.setValid(false);
                result.setErrors(errors);
                result.setRows(rows);
                return result;
            }

            // Parse data rows
            for (int i = headerDetection.headerRowIndex + 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                ExcelRow excelRow = parseRow(row, columnMap, i + 1);
                rows.add(excelRow);
            }

            result.setValid(errors.isEmpty() && rows.stream().allMatch(r -> r.isValidPhone() && r.isValidAvatar()));
            result.setErrors(errors);
            result.setRows(rows);

        } catch (IOException e) {
            logger.error("Error parsing Excel file: {}", e.getMessage());
            errors.add("Failed to read Excel file: " + e.getMessage());
            result.setValid(false);
            result.setErrors(errors);
            result.setRows(rows);
        }

        return result;
    }

    private Map<String, Integer> validateHeaders(Map<String, Integer> detectedColumnMap, List<String> errors) {
        Set<String> requiredColumns = Set.of("avatar", "phone", "name");
        for (String required : requiredColumns) {
            if (!detectedColumnMap.containsKey(required)) {
                errors.add("Column '" + required + "' not found");
            }
        }
        return detectedColumnMap;
    }

    private static final class HeaderDetection {
        private final int headerRowIndex;
        private final Map<String, Integer> columnMap;

        private HeaderDetection(int headerRowIndex, Map<String, Integer> columnMap) {
            this.headerRowIndex = headerRowIndex;
            this.columnMap = columnMap;
        }
    }

    private HeaderDetection detectHeader(Sheet sheet, Set<String> requiredColumns) {
        int lastRow = Math.min(sheet.getLastRowNum(), 30);
        HeaderDetection best = null;
        int bestScore = -1;

        for (int rowIndex = 0; rowIndex <= lastRow; rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row == null) continue;

            Map<String, Integer> columnMap = extractHeaderMap(row);
            if (columnMap.isEmpty()) continue;

            int score = 0;
            for (String required : requiredColumns) {
                if (columnMap.containsKey(required)) score++;
            }

            if (score > bestScore) {
                bestScore = score;
                best = new HeaderDetection(rowIndex, columnMap);
            }

            if (score == requiredColumns.size()) {
                return new HeaderDetection(rowIndex, columnMap);
            }
        }

        return best;
    }

    private Map<String, Integer> extractHeaderMap(Row headerRow) {
        Map<String, Integer> columnMap = new HashMap<>();

        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            Cell cell = headerRow.getCell(i);
            if (cell == null) continue;
            String raw = getCellStringValue(cell);
            if (raw == null || raw.isBlank()) continue;

            String normalized = normalizeHeader(raw);
            if (normalized.isEmpty()) continue;

            String canonical = canonicalHeaderKey(normalized);
            if (canonical == null) continue;

            columnMap.putIfAbsent(canonical, i);
        }

        return columnMap;
    }

    private String normalizeHeader(String header) {
        String s = header.replace("\uFEFF", "").trim().toLowerCase(Locale.ROOT);
        s = s.replaceAll("[^a-z0-9]+", "");
        return s;
    }

    private String canonicalHeaderKey(String normalizedHeader) {
        // Keep this intentionally permissive.
        return switch (normalizedHeader) {
            case "no", "nomor", "nomer", "number", "idx", "index" -> "no";
            case "avatar", "presenter", "pembicara", "pembawa", "speaker" -> "avatar";
            case "phone", "telp", "telepon", "hp", "handphone", "nohp", "nohandphone", "nowa", "wa", "whatsapp" -> "phone";
            case "name", "nama", "fullname", "namalengkap" -> "name";
            default -> null;
        };
    }

    private ExcelRow parseRow(Row row, Map<String, Integer> columnMap, int rowNum) {
        ExcelRow excelRow = new ExcelRow();
        excelRow.setRowNumber(rowNum);

        // Get values
        String name = getCellStringValue(row.getCell(columnMap.get("name")));
        String phone = getCellStringValue(row.getCell(columnMap.get("phone")));
        String avatarName = getCellStringValue(row.getCell(columnMap.get("avatar")));

        excelRow.setName(name);
        excelRow.setPhone(normalizePhone(phone));
        excelRow.setAvatar(avatarName);

        // Validate phone
        if (phone == null || phone.isEmpty()) {
            excelRow.setValidPhone(false);
            excelRow.setPhoneError("Phone number is empty");
        } else if (!isValidPhone(normalizePhone(phone))) {
            excelRow.setValidPhone(false);
            excelRow.setPhoneError("Invalid phone number format");
        } else {
            excelRow.setValidPhone(true);
        }

        // Validate avatar - allow both D-ID presenters and custom avatar names
        if (avatarName == null || avatarName.trim().isEmpty()) {
            excelRow.setValidAvatar(false);
            excelRow.setAvatarError("Nama avatar kosong");
        } else {
            String trimmedName = avatarName.trim();
            logger.info("Row {}: Validating avatar '{}'", rowNum, trimmedName);
            
            // Check if it's a D-ID presenter name or custom avatar
            // Custom avatars are always valid (will be stored as text)
            boolean isFromAPI = didService.avatarExistsByName(trimmedName);
            
            if (isFromAPI) {
                logger.info("Row {}: Avatar '{}' is a D-ID presenter", rowNum, trimmedName);
            } else {
                logger.info("Row {}: Avatar '{}' is a custom avatar name", rowNum, trimmedName);
            }
            
            // All non-empty avatar names are valid (custom or from API)
            excelRow.setValidAvatar(true);
        }

        return excelRow;
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                double value = cell.getNumericCellValue();
                if (value == Math.floor(value)) {
                    yield String.valueOf((long) value);
                }
                yield String.valueOf(value);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private String normalizePhone(String phone) {
        if (phone == null) return "";
        String s = phone.trim();
        if (s.isEmpty()) return "";

        // Handle scientific notation that may come in as a STRING cell (e.g. 6,2856E+12)
        if (s.matches(".*[eE].*")) {
            try {
                String normalized = s.replace(",", ".");
                BigDecimal bd = new BigDecimal(normalized);
                s = bd.toPlainString();
            } catch (Exception ignored) {
                // fall through
            }
        }

        boolean hasPlus = s.startsWith("+");
        String digits = s.replaceAll("\\D", "");
        if (digits.isEmpty()) return "";
        return hasPlus ? ("+" + digits) : digits;
    }

    private boolean isValidPhone(String phone) {
        return PHONE_PATTERN.matcher(phone).matches();
    }
}
