package com.shadcn.backend.controller;

import com.shadcn.backend.dto.*;
import com.shadcn.backend.model.User;
import com.shadcn.backend.entity.VideoReport;
import com.shadcn.backend.entity.VideoReportItem;
import com.shadcn.backend.repository.UserRepository;
import com.shadcn.backend.repository.VideoReportRepository;
import com.shadcn.backend.repository.VideoReportItemRepository;
import com.shadcn.backend.service.DIDService;
import com.shadcn.backend.service.VideoBackgroundCompositeService;
import com.shadcn.backend.service.VideoReportService;
import com.shadcn.backend.service.WhatsAppService;
import com.shadcn.backend.util.VideoLinkEncryptor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/video-reports")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class VideoReportController {

    private final VideoReportService videoReportService;
    private final DIDService didService;
    private final UserRepository userRepository;
    private final WhatsAppService whatsAppService;
    private final VideoReportItemRepository videoReportItemRepository;
    private final VideoReportRepository videoReportRepository;
    private final VideoBackgroundCompositeService videoBackgroundCompositeService;

    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;

    @Value("${server.servlet.context-path:}")
    private String serverContextPath;

    @Value("${app.wa.test.timeout-seconds}")
    private int waTestTimeoutSeconds;

    @Value("${app.wa.test.poll-interval-seconds}")
    private int waTestPollIntervalSeconds;

    @PostConstruct
    void validateVideoConfig() {
        if (waTestTimeoutSeconds <= 0) {
            throw new IllegalStateException("Invalid property app.wa.test.timeout-seconds; must be > 0");
        }
        if (waTestPollIntervalSeconds <= 0) {
            throw new IllegalStateException("Invalid property app.wa.test.poll-interval-seconds; must be > 0");
        }
    }

    public VideoReportController(VideoReportService videoReportService,
                                DIDService didService,
                                UserRepository userRepository,
                                WhatsAppService whatsAppService,
                                VideoReportItemRepository videoReportItemRepository,
                                VideoReportRepository videoReportRepository,
                                VideoBackgroundCompositeService videoBackgroundCompositeService) {
        this.videoReportService = videoReportService;
        this.didService = didService;
        this.userRepository = userRepository;
        this.whatsAppService = whatsAppService;
        this.videoReportItemRepository = videoReportItemRepository;
        this.videoReportRepository = videoReportRepository;
        this.videoBackgroundCompositeService = videoBackgroundCompositeService;
    }

    /**
     * Get default message template
     */
    @GetMapping("/template")
    public ResponseEntity<Map<String, String>> getDefaultTemplate() {
        Map<String, String> response = new HashMap<>();
        response.put("template", videoReportService.getDefaultMessageTemplate());
        response.put("waTemplate", videoReportService.getDefaultWaMessageTemplate());
        return ResponseEntity.ok(response);
    }

    /**
     * Get available D-ID presenters
     */
    @GetMapping("/presenters")
    public ResponseEntity<List<DIDPresenter>> getPresenters(
            @RequestParam(defaultValue = "true") boolean includeNotReadyExpress
    ) {
        return ResponseEntity.ok(
            didService.getPresentersForListing(includeNotReadyExpress)
                .stream()
                .filter(p -> p != null && "express".equalsIgnoreCase(p.getAvatar_type()))
                .toList()
        );
    }

    @GetMapping("/presenters/clips")
    public ResponseEntity<List<DIDPresenter>> getClipsPresenters(
            @RequestParam(defaultValue = "false") boolean includePublic
    ) {
        return ResponseEntity.ok(didService.getClipsPresentersFromApi(includePublic));
    }

    @GetMapping("/presenters/diagnostics")
    public ResponseEntity<Map<String, Object>> presentersDiagnostics() {
        return ResponseEntity.ok(didService.diagnosePresenterAccess());
    }

    /**
     * Download Excel template
     */
    @GetMapping("/template-excel")
    public ResponseEntity<byte[]> downloadExcelTemplate() {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet("Personal Sales Data");
            
            // Create header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            
            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"no", "avatar", "phone", "name"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // Create sample data rows
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);
            
            // Sample row 1
            Row row1 = sheet.createRow(1);
            createStyledCell(row1, 0, "1", dataStyle);
            createStyledCell(row1, 1, "AFAN", dataStyle);
            createStyledCell(row1, 2, "081234567890", dataStyle);
            createStyledCell(row1, 3, "John Doe", dataStyle);
            
            // Sample row 2
            Row row2 = sheet.createRow(2);
            createStyledCell(row2, 0, "2", dataStyle);
            createStyledCell(row2, 1, "Avatar Lain", dataStyle);
            createStyledCell(row2, 2, "082345678901", dataStyle);
            createStyledCell(row2, 3, "Jane Smith", dataStyle);
            
            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            workbook.write(out);
            
            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            responseHeaders.setContentDispositionFormData("attachment", "template_personal_sales.xlsx");
            
            return ResponseEntity.ok()
                    .headers(responseHeaders)
                    .body(out.toByteArray());
                    
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    private void createStyledCell(Row row, int column, String value, CellStyle style) {
        Cell cell = row.createCell(column);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    /**
     * Validate Excel file
     */
    @PostMapping("/validate-excel")
    public ResponseEntity<ExcelValidationResult> validateExcel(@RequestParam("file") MultipartFile file) {
        System.out.println("=== VALIDATE EXCEL CALLED ===");
        System.out.println("File name: " + (file != null ? file.getOriginalFilename() : "null"));
        System.out.println("File size: " + (file != null ? file.getSize() : 0));
        System.out.println("Content type: " + (file != null ? file.getContentType() : "null"));
        return ResponseEntity.ok(videoReportService.validateExcel(file));
    }

    /**
     * Export video report items to Excel
     */
    @GetMapping("/{id}/export-excel")
    public ResponseEntity<byte[]> exportToExcel(@PathVariable Long id) {
        try {
            List<VideoReportItem> items = videoReportService.getAllItemsByReportId(id);
            VideoReportResponse report = videoReportService.getVideoReport(id);
            
            if (report == null) {
                return ResponseEntity.notFound().build();
            }
            
            try (Workbook workbook = new XSSFWorkbook();
                 ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                
                Sheet sheet = workbook.createSheet("Report Data");
                
                // Create header style
                CellStyle headerStyle = workbook.createCellStyle();
                Font headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerStyle.setFont(headerFont);
                headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                headerStyle.setBorderBottom(BorderStyle.THIN);
                headerStyle.setBorderTop(BorderStyle.THIN);
                headerStyle.setBorderLeft(BorderStyle.THIN);
                headerStyle.setBorderRight(BorderStyle.THIN);
                
                // Create header row
                Row headerRow = sheet.createRow(0);
                String[] headers = {"No", "Nama", "No. HP", "Avatar", "Status Video", "Waktu Video Selesai", "URL Video", "Status WA", "Waktu WA Terkirim", "Error Video", "Error WA"};
                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                }
                
                // Create data style
                CellStyle dataStyle = workbook.createCellStyle();
                dataStyle.setBorderBottom(BorderStyle.THIN);
                dataStyle.setBorderTop(BorderStyle.THIN);
                dataStyle.setBorderLeft(BorderStyle.THIN);
                dataStyle.setBorderRight(BorderStyle.THIN);
                
                // Date format style
                CellStyle dateStyle = workbook.createCellStyle();
                dateStyle.cloneStyleFrom(dataStyle);
                CreationHelper createHelper = workbook.getCreationHelper();
                dateStyle.setDataFormat(createHelper.createDataFormat().getFormat("dd/MM/yyyy HH:mm:ss"));
                
                // Success style (green)
                CellStyle successStyle = workbook.createCellStyle();
                successStyle.cloneStyleFrom(dataStyle);
                successStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
                successStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                
                // Failed style (red)
                CellStyle failedStyle = workbook.createCellStyle();
                failedStyle.cloneStyleFrom(dataStyle);
                failedStyle.setFillForegroundColor(IndexedColors.CORAL.getIndex());
                failedStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                
                // Pending style (yellow)
                CellStyle pendingStyle = workbook.createCellStyle();
                pendingStyle.cloneStyleFrom(dataStyle);
                pendingStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
                pendingStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                
                // Fill data rows
                int rowNum = 1;
                java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
                for (VideoReportItem item : items) {
                    Row row = sheet.createRow(rowNum++);
                    
                    createStyledCell(row, 0, String.valueOf(item.getRowNumber()), dataStyle);
                    createStyledCell(row, 1, item.getName(), dataStyle);
                    createStyledCell(row, 2, item.getPhone(), dataStyle);
                    
                    // Get avatar name (handle both presenter_id and custom names)
                    String avatarDisplay = item.getAvatar();
                    // If avatar is a presenter_id, get the display name
                    if (avatarDisplay != null && avatarDisplay.startsWith("v2_")) {
                        // This is a presenter_id from API, try to get display name
                        java.util.Optional<com.shadcn.backend.model.DIDAvatar> avatarOpt = 
                            didService.getAvatarById(avatarDisplay);
                        if (avatarOpt.isPresent()) {
                            avatarDisplay = avatarOpt.get().getPresenterName();
                        }
                    }
                    // Otherwise it's already a custom name, use as-is
                    createStyledCell(row, 3, avatarDisplay, dataStyle);
                    
                    // Status Video with color
                    CellStyle videoStatusStyle = "DONE".equals(item.getStatus()) ? successStyle : 
                                                  "FAILED".equals(item.getStatus()) ? failedStyle : pendingStyle;
                    String videoStatusText = "DONE".equals(item.getStatus()) ? "Sukses" :
                                             "FAILED".equals(item.getStatus()) ? "Gagal" :
                                             "PROCESSING".equals(item.getStatus()) ? "Proses" : "Menunggu";
                    createStyledCell(row, 4, videoStatusText, videoStatusStyle);
                    
                    // Waktu Video Selesai
                    String videoTime = item.getVideoGeneratedAt() != null ? item.getVideoGeneratedAt().format(formatter) : "-";
                    createStyledCell(row, 5, videoTime, dataStyle);
                    
                    // URL Video
                    String videoUrl = item.getVideoUrl() != null ? item.getVideoUrl() : "-";
                    createStyledCell(row, 6, videoUrl, dataStyle);
                    
                    // Status WA with color
                    boolean waOk = "SENT".equals(item.getWaStatus()) || "DELIVERED".equals(item.getWaStatus());
                    boolean waErr = "FAILED".equals(item.getWaStatus()) || "ERROR".equals(item.getWaStatus());
                    CellStyle waStatusStyle = waOk ? successStyle : waErr ? failedStyle : pendingStyle;
                    String waStatusText = waOk ? "Terkirim" : waErr ? "Gagal" : "Menunggu";
                    createStyledCell(row, 7, waStatusText, waStatusStyle);
                    
                    // Waktu WA Terkirim
                    String waTime = item.getWaSentAt() != null ? item.getWaSentAt().format(formatter) : "-";
                    createStyledCell(row, 8, waTime, dataStyle);
                    
                    // Error messages
                    createStyledCell(row, 9, item.getErrorMessage() != null ? item.getErrorMessage() : "", dataStyle);
                    createStyledCell(row, 10, item.getWaErrorMessage() != null ? item.getWaErrorMessage() : "", dataStyle);
                }
                
                // Auto-size columns
                for (int i = 0; i < headers.length; i++) {
                    sheet.autoSizeColumn(i);
                }
                
                workbook.write(out);
                
                String filename = "report_" + report.getReportName().replaceAll("[^a-zA-Z0-9]", "_") + ".xlsx";
                
                HttpHeaders responseHeaders = new HttpHeaders();
                responseHeaders.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
                responseHeaders.setContentDispositionFormData("attachment", filename);
                
                return ResponseEntity.ok()
                        .headers(responseHeaders)
                        .body(out.toByteArray());
            }
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Create new video report and start generation
     */
    @PostMapping
    public ResponseEntity<VideoReportResponse> createVideoReport(@RequestBody VideoReportRequest request) {
        User currentUser = getCurrentUser();
        VideoReport report = videoReportService.createVideoReport(request, currentUser);
        
        // Start async video generation
        videoReportService.startVideoGeneration(report.getId());
        
        return ResponseEntity.ok(videoReportService.getVideoReport(report.getId()));
    }

    /**
     * Get video report by ID (without items - use /items endpoint for paginated items)
     */
    @GetMapping("/{id}")
    public ResponseEntity<VideoReportResponse> getVideoReport(@PathVariable Long id) {
        VideoReportResponse report = videoReportService.getVideoReport(id);
        if (report == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(report);
    }

    /**
     * Get video report items with server-side pagination, filtering, and search
     */
    @GetMapping("/{id}/items")
    public ResponseEntity<VideoReportResponse> getVideoReportItems(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String waStatus,
            @RequestParam(required = false) String search) {
        Pageable pageable = PageRequest.of(page, size);
        VideoReportResponse report = videoReportService.getVideoReportWithItems(id, pageable, status, waStatus, search);
        if (report == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(report);
    }

    /**
     * Get all video reports with pagination
     */
    @GetMapping
    public ResponseEntity<Page<VideoReportResponse>> getAllVideoReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(videoReportService.getAllVideoReports(pageable));
    }

    /**
     * Refresh status of pending clips
     */
    @PostMapping("/{id}/refresh-status")
    public ResponseEntity<VideoReportResponse> refreshStatus(@PathVariable Long id) {
        videoReportService.checkPendingClips(id);
        return ResponseEntity.ok(videoReportService.getVideoReport(id));
    }

    /**
     * Delete video report
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVideoReport(@PathVariable Long id) {
        videoReportService.deleteVideoReport(id);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Generate video for a single item
     */
    @PostMapping("/{reportId}/items/{itemId}/generate")
    public ResponseEntity<Map<String, Object>> generateSingleVideo(
            @PathVariable Long reportId,
            @PathVariable Long itemId) {
        try {
            VideoReportItem item = videoReportService.generateSingleVideo(reportId, itemId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("item", mapItemToResponse(item));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Toggle exclude item from video generation
     */
    @PostMapping("/{reportId}/items/{itemId}/toggle-exclude")
    public ResponseEntity<Map<String, Object>> toggleExcludeItem(
            @PathVariable Long reportId,
            @PathVariable Long itemId) {
        try {
            VideoReportItem item = videoReportService.toggleExcludeItem(reportId, itemId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("excluded", item.getExcluded());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Delete video for a single item
     */
    @DeleteMapping("/{reportId}/items/{itemId}/video")
    public ResponseEntity<Map<String, Object>> deleteItemVideo(
            @PathVariable Long reportId,
            @PathVariable Long itemId) {
        try {
            VideoReportItem item = videoReportService.deleteItemVideo(reportId, itemId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("item", mapItemToResponse(item));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Delete all videos in a report and reset
     */
    @DeleteMapping("/{id}/videos")
    public ResponseEntity<Map<String, Object>> deleteAllVideos(@PathVariable Long id) {
        try {
            videoReportService.deleteAllVideos(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Start WhatsApp blast for completed videos
     */
    @PostMapping("/{id}/wa-blast")
    public ResponseEntity<Map<String, Object>> startWaBlast(@PathVariable Long id) {
        try {
            videoReportService.startWaBlast(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "WhatsApp blast started");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Resend WhatsApp to a single item
     */
    @PostMapping("/{reportId}/items/{itemId}/resend-wa")
    public ResponseEntity<Map<String, Object>> resendWa(
            @PathVariable Long reportId,
            @PathVariable Long itemId) {
        try {
            VideoReportItem item = videoReportService.resendWa(reportId, itemId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("item", mapItemToResponse(item));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Update WA message template for a report
     */
    @PutMapping("/{id}/wa-template")
    public ResponseEntity<Map<String, Object>> updateWaTemplate(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        try {
            String waTemplate = request.get("waTemplate");
            VideoReport report = videoReportService.updateWaTemplate(id, waTemplate);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("waMessageTemplate", report.getWaMessageTemplate());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Sync WA message status from Wablas API
     */
    @PostMapping("/{id}/wa-sync")
    public ResponseEntity<Map<String, Object>> syncWaStatus(@PathVariable Long id) {
        try {
            Map<String, Object> result = videoReportService.syncWaStatus(id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Retry all failed video items in a report
     */
    @PostMapping("/{id}/retry-failed-videos")
    public ResponseEntity<Map<String, Object>> retryFailedVideos(@PathVariable Long id) {
        try {
            videoReportService.retryFailedVideos(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Retry started for failed videos");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Retry all failed WA messages in a report
     */
    @PostMapping("/{id}/retry-failed-wa")
    public ResponseEntity<Map<String, Object>> retryFailedWaMessages(@PathVariable Long id) {
        try {
            videoReportService.retryFailedWaMessages(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Retry started for failed WA messages");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Get WA message status from Wablas for a specific item
     */
    @GetMapping("/{reportId}/items/{itemId}/wa-status")
    public ResponseEntity<Map<String, Object>> getItemWaStatus(
            @PathVariable Long reportId,
            @PathVariable Long itemId) {
        try {
            VideoReportResponse.VideoReportItemResponse item = videoReportService.getVideoItemById(reportId, itemId);
            if (item == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", "Item not found");
                return ResponseEntity.badRequest().body(response);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("item", item);
            
            if (item.getWaMessageId() != null && !item.getWaMessageId().isEmpty()) {
                Map<String, Object> wablasStatus = whatsAppService.getMessageStatus(item.getWaMessageId());
                response.put("wablasStatus", wablasStatus);
            } else {
                response.put("wablasStatus", null);
                response.put("note", "No WA message ID available");
            }
            
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Check if phone number is registered on WhatsApp
     */
    @GetMapping("/wa/check-phone/{phone}")
    public ResponseEntity<Map<String, Object>> checkPhoneRegistration(@PathVariable String phone) {
        try {
            Map<String, Object> result = whatsAppService.checkPhoneRegistration(phone);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    private Map<String, Object> mapItemToResponse(VideoReportItem item) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", item.getId());
        response.put("rowNumber", item.getRowNumber());
        response.put("name", item.getName());
        response.put("phone", item.getPhone());
        response.put("avatar", item.getAvatar());
        response.put("personalizedMessage", item.getPersonalizedMessage());
        response.put("didClipId", item.getDidClipId());
        response.put("status", item.getStatus());
        response.put("videoUrl", item.getVideoUrl());
        response.put("errorMessage", item.getErrorMessage());
        response.put("waStatus", item.getWaStatus());
        response.put("waMessageId", item.getWaMessageId());
        response.put("waErrorMessage", item.getWaErrorMessage());
        response.put("waSentAt", item.getWaSentAt());
        response.put("excluded", item.getExcluded());
        return response;
    }

    /**
     * Generate encrypted shareable link for a video item
     */
    @GetMapping("/{reportId}/items/{itemId}/share-link")
    public ResponseEntity<Map<String, String>> generateShareableLink(
            @PathVariable Long reportId,
            @PathVariable Long itemId) {
        // Verify the item exists and belongs to the report
        VideoReportResponse.VideoReportItemResponse item = videoReportService.getVideoItemById(reportId, itemId);
        if (item == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Generate encrypted token
        String token = VideoLinkEncryptor.encryptVideoLinkShort(reportId, itemId);
        if (token == null) {
            return ResponseEntity.internalServerError().build();
        }
        
        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        response.put("shareUrl", "/v/" + token);
        return ResponseEntity.ok(response);
    }

    /**
     * Get video info by encrypted token (public endpoint - no auth required)
     * This endpoint is used for viewing shared videos
     */
    @GetMapping("/view/{token}")
    public ResponseEntity<Map<String, Object>> getVideoByToken(@PathVariable String token) {
        // Decrypt token
        Long[] ids = VideoLinkEncryptor.decryptVideoLink(token);
        if (ids == null || ids.length < 2) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Link tidak valid atau sudah kadaluarsa");
            return ResponseEntity.badRequest().body(error);
        }
        
        Long reportId = ids[0];
        Long itemId = ids[1];
        
        // Get video item
        VideoReportResponse.VideoReportItemResponse item = videoReportService.getVideoItemById(reportId, itemId);
        if (item == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Video tidak ditemukan");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
        
        // Return video info
        Map<String, Object> response = new HashMap<>();
        response.put("id", item.getId());
        response.put("name", item.getName());
        response.put("status", item.getStatus());
        String videoUrl = item.getVideoUrl();
        // Don't use composite stream URL, return original D-ID URL directly
        // Background composite requires ffmpeg which may not be installed
        response.put("videoUrl", videoUrl);
        response.put("personalizedMessage", item.getPersonalizedMessage());
        
        if (item.getVideoUrl() == null || item.getVideoUrl().isEmpty()) {
            if ("PROCESSING".equals(item.getStatus())) {
                response.put("message", "Video sedang diproses, silakan coba lagi nanti");
            } else if ("FAILED".equals(item.getStatus())) {
                response.put("message", "Video gagal dibuat");
            } else {
                response.put("message", "Video belum tersedia");
            }
        }
        
        return ResponseEntity.ok(response);
    }

    @RequestMapping(value = "/stream/{token}.mp4", method = {RequestMethod.GET, RequestMethod.HEAD})
    public ResponseEntity<?> streamVideoByToken(@PathVariable String token, HttpServletRequest request) {
        Long[] ids = VideoLinkEncryptor.decryptVideoLink(token);
        if (ids == null || ids.length < 2) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        Long reportId = ids[0];
        Long itemId = ids[1];

        VideoReportItem item = videoReportItemRepository.findByIdAndVideoReportId(itemId, reportId);
        if (item == null) {
            return ResponseEntity.notFound().build();
        }

        String sourceUrl = item.getVideoUrl();
        if (sourceUrl == null || sourceUrl.isBlank()) {
            return ResponseEntity.notFound().build();
        }

        VideoReport report = videoReportRepository.findById(reportId).orElse(null);
        if (report != null
                && "DONE".equals(item.getStatus())
                && Boolean.TRUE.equals(report.getUseBackground())
                && report.getBackgroundName() != null
                && !report.getBackgroundName().isBlank()) {
            boolean alreadyLocal = sourceUrl.contains("/api/images/") || sourceUrl.contains("/images/");
            if (!alreadyLocal) {
                try {
                    String composed = videoBackgroundCompositeService
                            .compositeToStoredVideoUrl(sourceUrl, report.getBackgroundName(), backendUrl, serverContextPath)
                            .orElse(null);
                    if (composed != null && !composed.isBlank()) {
                        item.setVideoUrl(composed);
                        videoReportItemRepository.save(item);
                        sourceUrl = composed;
                    }
                } catch (Exception ignored) {
                    // keep original
                }
            }
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setCacheControl("no-store");
        headers.add(HttpHeaders.LOCATION, sourceUrl);
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    /**
     * Get WhatsApp device status (for debugging)
     */
    @GetMapping("/wa/status")
    public ResponseEntity<Map<String, Object>> getWaStatus() {
        Map<String, Object> result = whatsAppService.getDeviceStatus();
        return ResponseEntity.ok(result);
    }

    /**
     * Validate phone number on WhatsApp (for debugging)
     */
    @GetMapping("/wa/validate/{phone}")
    public ResponseEntity<Map<String, Object>> validatePhone(@PathVariable String phone) {
        Map<String, Object> result = whatsAppService.validatePhoneNumber(phone);
        return ResponseEntity.ok(result);
    }

    /**
     * Test send WA message (for debugging)
     * Wablas API Reference: https://tegal.wablas.com/documentation/api
     * Phone format: 62xxx (without + prefix)
     */
    @PostMapping("/wa/test")
    public ResponseEntity<Map<String, Object>> testSendWa(@RequestBody Map<String, String> request) {
        Map<String, Object> result = new HashMap<>();
        try {
            String phone = request.get("phone");
            String message = request.getOrDefault("message", "Test message from Video Report System");
            
            // Show formatted phone for debugging
            String formattedPhone = whatsAppService.formatPhoneForDebug(phone);
            
            String messageId = whatsAppService.sendMessage(phone, message);
            result.put("success", true);
            result.put("messageId", messageId);
            result.put("originalPhone", phone);
            result.put("formattedPhone", formattedPhone);
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Test send WA video by URL (for debugging)
     * Phone format: 62xxx (without + prefix)
     */
    @PostMapping("/wa/test-video")
    public ResponseEntity<Map<String, Object>> testSendWaVideo(@RequestBody Map<String, String> request, HttpServletRequest httpRequest) {
        Map<String, Object> result = new HashMap<>();
        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                String forwardedFor = httpRequest == null ? null : httpRequest.getHeader("X-Forwarded-For");
                String remoteAddr = httpRequest == null ? null : httpRequest.getRemoteAddr();
                boolean isLocal = forwardedFor == null && (
                    "127.0.0.1".equals(remoteAddr) ||
                    "0:0:0:0:0:0:0:1".equals(remoteAddr) ||
                    "::1".equals(remoteAddr)
                );
                if (!isLocal) {
                    result.put("success", false);
                    result.put("error", "Unauthorized");
                    return ResponseEntity.status(401).body(result);
                }
            }

            String phone = request.get("phone");
            String caption = request.getOrDefault("caption", "Test video from Video Report System");
            String videoUrl = request.get("videoUrl");
            boolean waitUntilDelivered = "true".equalsIgnoreCase(request.getOrDefault("waitUntilDelivered", "false"));
            int timeoutSeconds;
            int pollIntervalSeconds;
            try {
                timeoutSeconds = Integer.parseInt(request.getOrDefault("timeoutSeconds", String.valueOf(waTestTimeoutSeconds)));
            } catch (Exception ignore) {
                timeoutSeconds = waTestTimeoutSeconds;
            }
            try {
                pollIntervalSeconds = Integer.parseInt(request.getOrDefault("pollIntervalSeconds", String.valueOf(waTestPollIntervalSeconds)));
            } catch (Exception ignore) {
                pollIntervalSeconds = waTestPollIntervalSeconds;
            }

            String formattedPhone = whatsAppService.formatPhoneForDebug(phone);
            if (videoUrl == null || videoUrl.isBlank()) {
                result.put("success", false);
                result.put("error", "Missing videoUrl");
                return ResponseEntity.ok(result);
            }

            String msg = caption == null ? "" : caption;
            if (!msg.isBlank()) {
                msg = msg + "\n";
            }
            msg = msg + videoUrl;

            Map<String, Object> sendResult = whatsAppService.sendTextMessageWithDetails(phone, msg);

            result.putAll(sendResult);
            result.put("originalPhone", phone);
            result.put("formattedPhone", formattedPhone);
            result.put("videoUrl", videoUrl);

            if (waitUntilDelivered && Boolean.TRUE.equals(sendResult.get("success"))) {
                Object msgIdObj = sendResult.get("messageId");
                String messageId = msgIdObj == null ? null : String.valueOf(msgIdObj);
                result.put("waitUntilDelivered", true);
                result.put("timeoutSeconds", timeoutSeconds);
                result.put("pollIntervalSeconds", pollIntervalSeconds);

                if (messageId == null || messageId.isBlank()) {
                    result.put("waitSuccess", false);
                    result.put("waitError", "Missing messageId from send response");
                } else {
                    long deadline = System.currentTimeMillis() + (timeoutSeconds * 1000L);
                    java.util.List<Map<String, Object>> polls = new java.util.ArrayList<>();
                    String lastStatus = null;

                    while (System.currentTimeMillis() < deadline) {
                        Map<String, Object> statusResult = whatsAppService.getMessageStatus(messageId);
                        Map<String, Object> snapshot = new HashMap<>();
                        snapshot.put("ts", java.time.LocalDateTime.now().toString());
                        snapshot.put("success", statusResult.get("success"));
                        snapshot.put("status", statusResult.get("status"));
                        snapshot.put("error", statusResult.get("error"));
                        polls.add(snapshot);

                        if (Boolean.TRUE.equals(statusResult.get("success"))) {
                            lastStatus = statusResult.get("status") == null ? null : String.valueOf(statusResult.get("status"));
                            if ("delivered".equalsIgnoreCase(lastStatus) || "read".equalsIgnoreCase(lastStatus)) {
                                result.put("waitSuccess", true);
                                result.put("finalWablasStatus", lastStatus);
                                result.put("polls", polls);
                                return ResponseEntity.ok(result);
                            }
                            if ("failed".equalsIgnoreCase(lastStatus) || "rejected".equalsIgnoreCase(lastStatus) || "cancel".equalsIgnoreCase(lastStatus)) {
                                result.put("waitSuccess", false);
                                result.put("finalWablasStatus", lastStatus);
                                result.put("waitError", "Terminal Wablas status: " + lastStatus);
                                result.put("polls", polls);
                                return ResponseEntity.ok(result);
                            }
                        }

                        try {
                            Thread.sleep(Math.max(1, pollIntervalSeconds) * 1000L);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }

                    result.put("waitSuccess", false);
                    result.put("finalWablasStatus", lastStatus);
                    result.put("waitError", "Timeout waiting for delivered/read");
                    result.put("polls", polls);
                }
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return ResponseEntity.ok(result);
    }
    
    /**
     * Debug phone format (for debugging Wablas API phone format)
     * Wablas API requires phone format: 62xxx (without + prefix)
     */
    @GetMapping("/wa/debug-phone/{phone}")
    public ResponseEntity<Map<String, Object>> debugPhoneFormat(@PathVariable String phone) {
        Map<String, Object> result = new HashMap<>();
        result.put("originalPhone", phone);
        result.put("formattedPhone", whatsAppService.formatPhoneForDebug(phone));
        result.put("wablasRequiredFormat", "62xxx (tanpa + di depan)");
        result.put("example", "6285600121760");
        return ResponseEntity.ok(result);
    }
    
    /**
     * Force trigger WA blast for testing (debug endpoint)
     * This bypasses auto-trigger and sends WA immediately
     */
    @PostMapping("/{id}/force-wa-blast")
    public ResponseEntity<Map<String, Object>> forceWaBlast(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            VideoReportResponse report = videoReportService.getVideoReport(id);
            if (report == null) {
                response.put("success", false);
                response.put("error", "Report not found");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Check if there are items ready
            response.put("reportId", id);
            response.put("reportStatus", report.getStatus());
            response.put("totalRecords", report.getTotalRecords());
            response.put("successCount", report.getSuccessCount());
            response.put("waSentCount", report.getWaSentCount());
            response.put("waFailedCount", report.getWaFailedCount());
            
            // Force start WA blast
            videoReportService.startWaBlast(id);
            
            response.put("success", true);
            response.put("message", "WA blast force triggered - check logs for progress");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Debug endpoint to check WA blast readiness
     */
    @GetMapping("/{id}/wa-debug")
    public ResponseEntity<Map<String, Object>> waBlastDebug(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            VideoReportResponse report = videoReportService.getVideoReport(id);
            if (report == null) {
                response.put("success", false);
                response.put("error", "Report not found");
                return ResponseEntity.badRequest().body(response);
            }
            
            response.put("reportId", id);
            response.put("reportStatus", report.getStatus());
            response.put("totalRecords", report.getTotalRecords());
            response.put("processedRecords", report.getProcessedRecords());
            response.put("successCount", report.getSuccessCount());
            response.put("failedCount", report.getFailedCount());
            response.put("waSentCount", report.getWaSentCount());
            response.put("waFailedCount", report.getWaFailedCount());
            response.put("waPendingCount", report.getWaPendingCount());
            
            // Check WA device status
            Map<String, Object> deviceStatus = whatsAppService.getDeviceStatus();
            response.put("waDeviceStatus", deviceStatus);
            
            response.put("success", true);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            return userRepository.findByUsername(username).orElse(null);
        }
        return null;
    }
}
