package com.shadcn.backend.service;

import com.shadcn.backend.dto.PdfExcelValidationResult;
import com.shadcn.backend.dto.PdfExcelValidationResult.PdfExcelRow;
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
public class PdfExcelService {
    private static final Logger logger = LoggerFactory.getLogger(PdfExcelService.class);
    
    // Indonesian phone regex - starts with 08 or +628 or 628
    private static final Pattern PHONE_PATTERN = Pattern.compile("^(\\+62|62|0)8[1-9][0-9]{7,10}$");

    /**
     * Parse and validate Excel file for PDF reports
     * Expected columns: no, phone, name
     */
    public PdfExcelValidationResult parseAndValidateExcel(MultipartFile file) {
        PdfExcelValidationResult result = new PdfExcelValidationResult();
        List<String> errors = new ArrayList<>();
        List<PdfExcelRow> rows = new ArrayList<>();

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

                PdfExcelRow excelRow = parseRow(row, columnMap, i + 1);
                rows.add(excelRow);
            }

            result.setValid(errors.isEmpty() && rows.stream().allMatch(PdfExcelRow::isValidPhone));
            result.setErrors(errors);
            result.setRows(rows);

        } catch (IOException e) {
            logger.error("Error parsing Excel file: {}", e.getMessage());
            errors.add("Gagal membaca file Excel: " + e.getMessage());
            result.setValid(false);
            result.setErrors(errors);
        }

        return result;
    }

    private Map<String, Integer> validateHeaders(Row headerRow, List<String> errors) {
        Map<String, Integer> columnMap = new HashMap<>();
        Set<String> requiredColumns = new HashSet<>(Arrays.asList("no", "phone", "name"));
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
                errors.add("Kolom '" + required + "' tidak ditemukan");
            }
        }

        return columnMap;
    }

    private PdfExcelRow parseRow(Row row, Map<String, Integer> columnMap, int rowNum) {
        PdfExcelRow excelRow = new PdfExcelRow();
        excelRow.setRowNumber(rowNum);

        // Get values
        String name = getCellStringValue(row.getCell(columnMap.get("name")));
        String phone = getCellStringValue(row.getCell(columnMap.get("phone")));

        excelRow.setName(name);
        excelRow.setPhone(normalizePhone(phone));

        // Validate phone
        if (phone == null || phone.isEmpty()) {
            excelRow.setValidPhone(false);
            excelRow.setPhoneError("Nomor telepon kosong");
        } else if (!isValidPhone(normalizePhone(phone))) {
            excelRow.setValidPhone(false);
            excelRow.setPhoneError("Format nomor telepon tidak valid");
        } else {
            excelRow.setValidPhone(true);
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
