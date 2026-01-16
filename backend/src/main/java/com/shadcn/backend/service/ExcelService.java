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
    
    // Phone validation:
    // - Accept E.164 digits (with optional '+'): 8..15 digits, cannot start with 0
    // - Also accept Indonesian local mobile formats (08xx / 62xx / +62xx)
    private static final Pattern PHONE_PATTERN = Pattern.compile("^((\\+[1-9]\\d{7,14})|([1-9]\\d{7,14})|((\\+62|62|0)8[1-9][0-9]{7,10}))$");
    
    private final HeyGenService heyGenService;

    public ExcelService(HeyGenService heyGenService) {
        this.heyGenService = heyGenService;
    }

    /**
     * Parse and validate Excel file
     * Expected columns: no, avatar (name), phone, name
    * Avatar validation (HeyGen):
    * - Accept avatar_id directly
    * - Or match against display_name/avatar_name from HeyGen avatars list
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

            validateAvatars(rows);

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

        // Avatar validation is done in a batch pass (single HeyGen lookup per file)
        excelRow.setValidAvatar(false);

        return excelRow;
    }

    private void validateAvatars(List<ExcelRow> rows) {
        if (rows == null || rows.isEmpty()) {
            return;
        }

        Map<String, String> avatarIdByName = new HashMap<>();
        Set<String> avatarIds = new HashSet<>();

        try {
            List<Map<String, Object>> avatars = heyGenService.listAvatars();
            if (avatars != null) {
                for (Map<String, Object> a : avatars) {
                    if (a == null) {
                        continue;
                    }

                    String id = a.get("avatar_id") == null ? null : String.valueOf(a.get("avatar_id"));
                    if (id == null || id.isBlank()) {
                        continue;
                    }
                    avatarIds.add(id.trim());

                    String displayName = a.get("display_name") == null ? null : String.valueOf(a.get("display_name"));
                    String avatarName = a.get("avatar_name") == null ? null : String.valueOf(a.get("avatar_name"));

                    String nd = normalizePresenterNameForMatch(displayName);
                    if (!nd.isEmpty()) {
                        avatarIdByName.putIfAbsent(nd, id.trim());
                    }
                    String na = normalizePresenterNameForMatch(avatarName);
                    if (!na.isEmpty()) {
                        avatarIdByName.putIfAbsent(na, id.trim());
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to fetch HeyGen avatars for validation: {}", e.getMessage());
        }

        for (ExcelRow row : rows) {
            if (row == null) continue;
            String avatarName = row.getAvatar();

            if (avatarName == null || avatarName.trim().isEmpty()) {
                row.setValidAvatar(false);
                row.setAvatarError("Nama avatar kosong");
                continue;
            }

            String trimmed = avatarName.trim();

            if (!avatarIds.isEmpty() && avatarIds.contains(trimmed)) {
                row.setValidAvatar(true);
                continue;
            }

            String normalized = normalizePresenterNameForMatch(trimmed);
            if (!avatarIdByName.isEmpty() && avatarIdByName.containsKey(normalized)) {
                row.setValidAvatar(true);
            } else {
                row.setValidAvatar(false);
                row.setAvatarError("Avatar tidak ditemukan");
            }
        }
    }

    private String normalizePresenterNameForMatch(String name) {
        if (name == null) {
            return "";
        }
        return name.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
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
