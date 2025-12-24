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
            Row headerRow = sheet.getRow(0);
            
            if (headerRow == null) {
                errors.add("File Excel kosong atau tidak memiliki header");
                result.setValid(false);
                result.setErrors(errors);
                return result;
            }

            // Validate headers
            Map<String, Integer> columnMap = validateHeaders(headerRow, errors);
            if (!errors.isEmpty()) {
                result.setValid(false);
                result.setErrors(errors);
                return result;
            }

            // Parse data rows
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
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
        }

        return result;
    }

    private Map<String, Integer> validateHeaders(Row headerRow, List<String> errors) {
        Map<String, Integer> columnMap = new HashMap<>();
        Set<String> requiredColumns = new HashSet<>(Arrays.asList("no", "avatar", "phone", "name"));
        Set<String> foundColumns = new HashSet<>();

        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            Cell cell = headerRow.getCell(i);
            if (cell != null) {
                String header = getCellStringValue(cell).toLowerCase().trim();
                if (requiredColumns.contains(header)) {
                    columnMap.put(header, i);
                    foundColumns.add(header);
                }
            }
        }

        // Check missing columns
        for (String required : requiredColumns) {
            if (!foundColumns.contains(required)) {
                errors.add("Column '" + required + "' not found");
            }
        }

        return columnMap;
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

        // Validate avatar by name using database + D-ID API fallback
        if (avatarName == null || avatarName.trim().isEmpty()) {
            excelRow.setValidAvatar(false);
            excelRow.setAvatarError("Nama avatar kosong");
        } else {
            String trimmedName = avatarName.trim();
            logger.info("Row {}: Validating avatar '{}'", rowNum, trimmedName);
            
            // Use the new method that checks database first, then refreshes from API if needed
            boolean exists = didService.avatarExistsByName(trimmedName);
            
            if (!exists) {
                excelRow.setValidAvatar(false);
                excelRow.setAvatarError("Avatar '" + trimmedName + "' not found. Please ensure the avatar name matches D-ID Studio.");
                logger.warn("Row {}: Avatar '{}' NOT FOUND after database check and API refresh", rowNum, trimmedName);
            } else {
                excelRow.setValidAvatar(true);
                logger.info("Row {}: Avatar '{}' is VALID", rowNum, trimmedName);
            }
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
        // Remove spaces, dashes, etc.
        phone = phone.replaceAll("[\\s\\-\\(\\)\\.]", "");
        return phone;
    }

    private boolean isValidPhone(String phone) {
        return PHONE_PATTERN.matcher(phone).matches();
    }
}
