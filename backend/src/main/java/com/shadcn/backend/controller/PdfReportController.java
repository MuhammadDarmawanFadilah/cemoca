package com.shadcn.backend.controller;

import com.shadcn.backend.dto.PdfExcelValidationResult;
import com.shadcn.backend.dto.PdfReportRequest;
import com.shadcn.backend.dto.PdfReportResponse;
import com.shadcn.backend.entity.PdfReport;
import com.shadcn.backend.entity.PdfReportItem;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.UserRepository;
import com.shadcn.backend.service.PdfReportService;
import com.shadcn.backend.util.PdfLinkEncryptor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pdf-reports")
public class PdfReportController {

    private static final Logger logger = LoggerFactory.getLogger(PdfReportController.class);

    private final PdfReportService pdfReportService;
    private final UserRepository userRepository;

    @Value("${app.upload.pdf-dir:uploads/pdfs}")
    private String pdfUploadDir;

    public PdfReportController(PdfReportService pdfReportService, UserRepository userRepository) {
        this.pdfReportService = pdfReportService;
        this.userRepository = userRepository;
    }

    /**
     * Get templates for PDF report
     */
    @GetMapping("/template")
    public ResponseEntity<Map<String, String>> getTemplates() {
        Map<String, String> templates = new HashMap<>();
        templates.put("messageTemplate", pdfReportService.getDefaultMessageTemplate());
        templates.put("waMessageTemplate", pdfReportService.getDefaultWaMessageTemplate());
        return ResponseEntity.ok(templates);
    }

    /**
     * Download Excel template for PDF report
     */
    @GetMapping("/template-excel")
    public ResponseEntity<byte[]> downloadExcelTemplate() {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Data");

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"no", "phone", "name"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Add sample data
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            String[][] sampleData = {
                {"1", "081234567890", "John Doe"},
                {"2", "082345678901", "Jane Smith"},
                {"3", "083456789012", "Bob Johnson"}
            };

            for (int i = 0; i < sampleData.length; i++) {
                Row row = sheet.createRow(i + 1);
                for (int j = 0; j < sampleData[i].length; j++) {
                    Cell cell = row.createCell(j);
                    cell.setCellValue(sampleData[i][j]);
                    cell.setCellStyle(dataStyle);
                }
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);

            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            responseHeaders.setContentDispositionFormData("attachment", "template-pdf-report.xlsx");

            return ResponseEntity.ok()
                    .headers(responseHeaders)
                    .body(baos.toByteArray());
        } catch (IOException e) {
            logger.error("Error generating Excel template", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Validate Excel file for PDF report
     */
    @PostMapping("/validate-excel")
    public ResponseEntity<PdfExcelValidationResult> validateExcel(@RequestParam("file") MultipartFile file) {
        PdfExcelValidationResult result = pdfReportService.validateExcel(file);
        return ResponseEntity.ok(result);
    }

    /**
     * Create PDF report
     */
    @PostMapping
    public ResponseEntity<?> createPdfReport(@RequestBody PdfReportRequest request) {
        try {
            // Get user from request body userId
            User user = null;
            if (request.getUserId() != null) {
                user = userRepository.findById(request.getUserId()).orElse(null);
            }
            
            // If no user found, use admin user (id=1) as default
            if (user == null) {
                user = userRepository.findById(1L).orElse(null);
            }
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "User not found. Please ensure a valid user exists."));
            }

            PdfReport report = pdfReportService.createPdfReport(request, user);

            // Start PDF generation async
            pdfReportService.startPdfGeneration(report.getId());

            return ResponseEntity.ok(Map.of(
                "id", report.getId(),
                "message", "PDF report created and PDF generation started"
            ));
        } catch (Exception e) {
            logger.error("Error creating PDF report", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all PDF reports (paginated)
     */
    @GetMapping
    public ResponseEntity<Page<PdfReportResponse>> getAllPdfReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(pdfReportService.getAllPdfReports(pageable));
    }

    /**
     * Get PDF report by ID with paginated items
     */
    @GetMapping("/{id}")
    public ResponseEntity<PdfReportResponse> getPdfReport(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String waStatus,
            @RequestParam(required = false) String search) {
        Pageable pageable = PageRequest.of(page, size);
        PdfReportResponse report = pdfReportService.getPdfReportWithItems(id, pageable, status, waStatus, search);
        if (report == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(report);
    }

    /**
     * Delete PDF report
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePdfReport(@PathVariable Long id) {
        try {
            pdfReportService.deletePdfReport(id);
            return ResponseEntity.ok(Map.of("message", "PDF report deleted"));
        } catch (Exception e) {
            logger.error("Error deleting PDF report", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Generate single PDF
     */
    @PostMapping("/{reportId}/items/{itemId}/generate")
    public ResponseEntity<?> generateSinglePdf(
            @PathVariable Long reportId,
            @PathVariable Long itemId) {
        try {
            PdfReportItem item = pdfReportService.generateSinglePdf(reportId, itemId);
            return ResponseEntity.ok(Map.of(
                "message", "PDF generated",
                "pdfUrl", item.getPdfUrl()
            ));
        } catch (Exception e) {
            logger.error("Error generating single PDF", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Toggle exclude item
     */
    @PostMapping("/{reportId}/items/{itemId}/toggle-exclude")
    public ResponseEntity<?> toggleExclude(
            @PathVariable Long reportId,
            @PathVariable Long itemId) {
        try {
            PdfReportItem item = pdfReportService.toggleExcludeItem(reportId, itemId);
            return ResponseEntity.ok(Map.of(
                "message", "Item exclusion toggled",
                "excluded", item.getExcluded()
            ));
        } catch (Exception e) {
            logger.error("Error toggling exclude", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete PDF for single item
     */
    @DeleteMapping("/{reportId}/items/{itemId}/pdf")
    public ResponseEntity<?> deleteItemPdf(
            @PathVariable Long reportId,
            @PathVariable Long itemId) {
        try {
            pdfReportService.deleteItemPdf(reportId, itemId);
            return ResponseEntity.ok(Map.of("message", "PDF deleted"));
        } catch (Exception e) {
            logger.error("Error deleting item PDF", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete all PDFs in report
     */
    @DeleteMapping("/{reportId}/pdfs")
    public ResponseEntity<?> deleteAllPdfs(@PathVariable Long reportId) {
        try {
            pdfReportService.deleteAllPdfs(reportId);
            return ResponseEntity.ok(Map.of("message", "All PDFs deleted"));
        } catch (Exception e) {
            logger.error("Error deleting all PDFs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Start WA blast
     */
    @PostMapping("/{reportId}/wa-blast")
    public ResponseEntity<?> startWaBlast(@PathVariable Long reportId) {
        try {
            pdfReportService.startWaBlast(reportId);
            return ResponseEntity.ok(Map.of("message", "WA blast started"));
        } catch (Exception e) {
            logger.error("Error starting WA blast", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Resend WA for single item
     */
    @PostMapping("/{reportId}/items/{itemId}/resend-wa")
    public ResponseEntity<?> resendWa(
            @PathVariable Long reportId,
            @PathVariable Long itemId) {
        try {
            PdfReportItem item = pdfReportService.resendWa(reportId, itemId);
            return ResponseEntity.ok(Map.of(
                "message", "WA sent",
                "waStatus", item.getWaStatus()
            ));
        } catch (Exception e) {
            logger.error("Error resending WA", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update WA template
     */
    @PutMapping("/{reportId}/wa-template")
    public ResponseEntity<?> updateWaTemplate(
            @PathVariable Long reportId,
            @RequestBody Map<String, String> request) {
        try {
            String waTemplate = request.get("waMessageTemplate");
            PdfReport report = pdfReportService.updateWaTemplate(reportId, waTemplate);
            return ResponseEntity.ok(Map.of("message", "WA template updated"));
        } catch (Exception e) {
            logger.error("Error updating WA template", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Retry failed PDFs
     */
    @PostMapping("/{reportId}/retry-failed")
    public ResponseEntity<?> retryFailedPdfs(@PathVariable Long reportId) {
        try {
            pdfReportService.retryFailedPdfs(reportId);
            return ResponseEntity.ok(Map.of("message", "Retrying failed PDFs"));
        } catch (Exception e) {
            logger.error("Error retrying failed PDFs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Retry failed WA messages
     */
    @PostMapping("/{reportId}/retry-failed-wa")
    public ResponseEntity<?> retryFailedWaMessages(@PathVariable Long reportId) {
        try {
            pdfReportService.retryFailedWaMessages(reportId);
            return ResponseEntity.ok(Map.of("message", "Retrying failed WA messages"));
        } catch (Exception e) {
            logger.error("Error retrying failed WA messages", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Export report to Excel
     */
    @GetMapping("/{reportId}/export")
    public ResponseEntity<byte[]> exportToExcel(@PathVariable Long reportId) {
        try {
            PdfReportResponse report = pdfReportService.getPdfReport(reportId);
            if (report == null) {
                return ResponseEntity.notFound().build();
            }

            List<PdfReportItem> items = pdfReportService.getAllItemsByReportId(reportId);

            try (Workbook workbook = new XSSFWorkbook()) {
                Sheet sheet = workbook.createSheet("PDF Report");

                // Header style
                CellStyle headerStyle = workbook.createCellStyle();
                Font headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerStyle.setFont(headerFont);
                headerStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

                // Create header row
                Row headerRow = sheet.createRow(0);
                String[] headers = {"No", "Name", "Phone", "Status", "PDF URL", "PDF Generated", "WA Status", "WA Sent"};
                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                }

                DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

                // Add data rows
                int rowNum = 1;
                for (PdfReportItem item : items) {
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(item.getRowNumber());
                    row.createCell(1).setCellValue(item.getName());
                    row.createCell(2).setCellValue(item.getPhone());
                    row.createCell(3).setCellValue(item.getStatus());
                    row.createCell(4).setCellValue(item.getPdfUrl() != null ? item.getPdfUrl() : "");
                    row.createCell(5).setCellValue(item.getPdfGeneratedAt() != null ? item.getPdfGeneratedAt().format(dtf) : "");
                    row.createCell(6).setCellValue(item.getWaStatus());
                    row.createCell(7).setCellValue(item.getWaSentAt() != null ? item.getWaSentAt().format(dtf) : "");
                }

                // Auto-size columns
                for (int i = 0; i < headers.length; i++) {
                    sheet.autoSizeColumn(i);
                }

                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                workbook.write(baos);

                String filename = report.getReportName().replaceAll("[^a-zA-Z0-9]", "_") + "_" +
                        LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx";

                HttpHeaders responseHeaders = new HttpHeaders();
                responseHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);
                responseHeaders.setContentDispositionFormData("attachment", filename);

                return ResponseEntity.ok()
                        .headers(responseHeaders)
                        .body(baos.toByteArray());
            }
        } catch (Exception e) {
            logger.error("Error exporting to Excel", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Serve PDF file (protected, for direct download)
     */
    @GetMapping("/files/{reportId}/{filename}")
    public ResponseEntity<Resource> servePdfFile(
            @PathVariable Long reportId,
            @PathVariable String filename) {
        try {
            // Get absolute path - resolve relative to user.dir (project root)
            Path basePath = Paths.get(System.getProperty("user.dir")).normalize();
            Path filePath = basePath.resolve(pdfUploadDir).resolve(String.valueOf(reportId)).resolve(filename).normalize();
            
            logger.info("[PDF SERVE] Base dir: {}", basePath);
            logger.info("[PDF SERVE] Looking for file at: {}", filePath);
            
            if (!Files.exists(filePath)) {
                logger.warn("[PDF SERVE] File not found: {}", filePath);
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(filePath);
            logger.info("[PDF SERVE] Serving file: {}", filename);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .header("X-Frame-Options", "ALLOWALL")
                    .header("Content-Security-Policy", "frame-ancestors *")
                    .body(resource);
        } catch (Exception e) {
            logger.error("Error serving PDF file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Public view PDF by token (no auth required)
     */
    @GetMapping("/view/{token}")
    public ResponseEntity<?> viewPdfByToken(@PathVariable String token) {
        try {
            Map<String, Object> decrypted = PdfLinkEncryptor.decryptPdfLink(token);
            if (decrypted == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invalid or expired link"));
            }

            Long reportId = (Long) decrypted.get("reportId");
            Long itemId = (Long) decrypted.get("itemId");

            PdfReportResponse.PdfReportItemResponse item = pdfReportService.getPdfItemById(reportId, itemId);
            if (item == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(Map.of(
                "name", item.getName(),
                "pdfUrl", item.getPdfUrl(),
                "pdfFilename", item.getPdfFilename()
            ));
        } catch (Exception e) {
            logger.error("Error viewing PDF by token", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid or expired link"));
        }
    }
}
