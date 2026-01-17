package com.shadcn.backend.controller;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.shadcn.backend.dto.ExcelValidationResult;
import com.shadcn.backend.dto.VideoAvatarOption;
import com.shadcn.backend.dto.VideoPreviewRequest;
import com.shadcn.backend.dto.VideoPreviewResponse;
import com.shadcn.backend.dto.VideoReportRequest;
import com.shadcn.backend.dto.VideoReportResponse;
import com.shadcn.backend.entity.VideoReport;
import com.shadcn.backend.entity.VideoReportItem;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.VideoReportItemRepository;
import com.shadcn.backend.repository.VideoReportRepository;
import com.shadcn.backend.service.AuthService;
import com.shadcn.backend.service.HeyGenService;
import com.shadcn.backend.service.VideoBackgroundCompositeService;
import com.shadcn.backend.service.VideoReportService;
import com.shadcn.backend.service.WhatsAppService;
import com.shadcn.backend.util.VideoLinkEncryptor;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/video-reports")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class VideoReportController {

    private static final Logger logger = LoggerFactory.getLogger(VideoReportController.class);

    private static final long PREVIEW_CONTEXT_TTL_MS = 60L * 60L * 1000L;
    private static final ConcurrentHashMap<String, PreviewContext> previewContexts = new ConcurrentHashMap<>();

    private static final class PreviewContext {
        private final boolean useBackground;
        private final String backgroundName;
        private final String videoLanguageCode;
        private final long createdAtMs;
        private volatile String compositedUrl;
        private volatile String translatedUrl;
        private volatile String providerTranslateId;

        private PreviewContext(boolean useBackground, String backgroundName, String videoLanguageCode) {
            this.useBackground = useBackground;
            this.backgroundName = backgroundName;
            this.videoLanguageCode = videoLanguageCode;
            this.createdAtMs = System.currentTimeMillis();
        }
    }

    private static boolean shouldTranslateVideoLanguage(String videoLanguageCode) {
        if (videoLanguageCode == null) {
            return false;
        }
        String v = videoLanguageCode.trim();
        if (v.isBlank()) {
            return false;
        }

        String key = v.toLowerCase(java.util.Locale.ROOT);
        if (key.equals("en") || key.startsWith("en-") || key.equals("english") || key.contains("english")) {
            return false;
        }

        return true;
    }

    private final VideoReportService videoReportService;
    private final HeyGenService heyGenService;
    private final AuthService authService;
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

    @Value("${app.video.share-dir:${app.video.base-dir}/share}")
    private String videoShareDir;

    @Value("${app.video.cache.retention-days:30}")
    private int videoCacheRetentionDays;

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
                                HeyGenService heyGenService,
                                AuthService authService,
                                WhatsAppService whatsAppService,
                                VideoReportItemRepository videoReportItemRepository,
                                VideoReportRepository videoReportRepository,
                                VideoBackgroundCompositeService videoBackgroundCompositeService) {
        this.videoReportService = videoReportService;
        this.heyGenService = heyGenService;
        this.authService = authService;
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

    @PostMapping("/preview")
    public ResponseEntity<VideoPreviewResponse> startPreview(
            @RequestBody VideoPreviewRequest request,
            @RequestHeader(value = "Authorization", required = false) String token
    ) {
        try {
            cleanupPreviewContexts();

            if (request == null) {
                return ResponseEntity.badRequest().body(new VideoPreviewResponse(false, null, null, null, null, "Invalid request"));
            }

            User currentUser = getCurrentUser(token);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new VideoPreviewResponse(false, null, null, null, null, "Unauthorized"));
            }

            String name = request.getName() == null ? "" : request.getName().trim();
            String avatar = request.getAvatar() == null ? "" : request.getAvatar().trim();
            String messageTemplate = request.getMessageTemplate() == null ? "" : request.getMessageTemplate();
            String videoLanguageCode = request.getVideoLanguageCode() == null ? null : request.getVideoLanguageCode().trim();

            if (name.isBlank()) {
                return ResponseEntity.badRequest().body(new VideoPreviewResponse(false, null, null, null, null, "Nama wajib diisi"));
            }
            if (avatar.isBlank()) {
                return ResponseEntity.badRequest().body(new VideoPreviewResponse(false, null, null, null, null, "Avatar wajib diisi"));
            }
            if (messageTemplate.isBlank()) {
                return ResponseEntity.badRequest().body(new VideoPreviewResponse(false, null, null, null, null, "Template pesan wajib diisi"));
            }

            Long tempReportId = null;
            try {
                VideoReportRequest temp = new VideoReportRequest();
                temp.setReportName("__PREVIEW__");
                temp.setMessageTemplate(messageTemplate);
                temp.setVideoLanguageCode(videoLanguageCode);
                temp.setWaMessageTemplate(videoReportService.getDefaultWaMessageTemplate());
                temp.setUseBackground(Boolean.TRUE.equals(request.getUseBackground()));
                temp.setBackgroundName(request.getBackgroundName());
                temp.setPreview(true);

                VideoReportRequest.VideoReportItemRequest it = new VideoReportRequest.VideoReportItemRequest();
                it.setRowNumber(request.getRowNumber() == null ? 1 : request.getRowNumber());
                it.setName(name);
                it.setPhone(request.getPhone());
                it.setAvatar(avatar);
                temp.setItems(java.util.List.of(it));

                VideoReport report = videoReportService.createVideoReport(temp, currentUser);
                tempReportId = report.getId();

                java.util.List<VideoReportItem> items = videoReportItemRepository.findByVideoReportIdOrderByRowNumberAsc(tempReportId);
                if (items == null || items.isEmpty()) {
                    return ResponseEntity.badRequest().body(new VideoPreviewResponse(false, null, null, null, null, "Preview item not found"));
                }

                VideoReportItem item = videoReportService.generateSingleVideo(tempReportId, items.get(0).getId());
                String providerVideoId = item == null ? null : item.getProviderVideoId();
                if (providerVideoId == null || providerVideoId.isBlank()) {
                    String err = item == null ? null : item.getErrorMessage();
                    return ResponseEntity.badRequest().body(new VideoPreviewResponse(false, null, null, null, null, err == null ? "Failed to create video" : err));
                }

                boolean useBg = Boolean.TRUE.equals(request.getUseBackground());
                String bgName = request.getBackgroundName();
                if (useBg && bgName != null && !bgName.isBlank()) {
                    previewContexts.put(providerVideoId, new PreviewContext(true, bgName, videoLanguageCode));
                } else {
                    previewContexts.put(providerVideoId, new PreviewContext(false, null, videoLanguageCode));
                }

                return ResponseEntity.ok(new VideoPreviewResponse(true, providerVideoId, "processing", "clip", null, null));
            } finally {
                if (tempReportId != null) {
                    try {
                        videoReportItemRepository.deleteByVideoReportId(tempReportId);
                    } catch (Exception ignore) {
                    }
                    try {
                        videoReportRepository.deleteById(tempReportId);
                    } catch (Exception ignore) {
                    }
                }
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new VideoPreviewResponse(false, null, null, null, null, e.getMessage()));
        }
    }

    @GetMapping("/preview/{videoId}")
    public ResponseEntity<VideoPreviewResponse> getPreviewStatus(@PathVariable String videoId) {
        try {
            cleanupPreviewContexts();

            if (videoId == null || videoId.isBlank()) {
                return ResponseEntity.badRequest().body(new VideoPreviewResponse(false, null, null, null, null, "Invalid videoId"));
            }

            Map<String, Object> status = heyGenService.getVideoStatus(videoId.trim());
            String s = status.get("status") == null ? null : String.valueOf(status.get("status"));
            String type = "video";
            String resultUrl = status.get("video_url") == null ? null : String.valueOf(status.get("video_url"));
            String err = status.get("error") == null ? null : String.valueOf(status.get("error"));

            if ("completed".equalsIgnoreCase(s) && resultUrl != null && !resultUrl.isBlank()) {
                PreviewContext ctx = previewContexts.get(videoId.trim());
                if (ctx != null) {
                    String targetLang = ctx.videoLanguageCode;
                    if (targetLang != null) {
                        targetLang = targetLang.trim();
                    }

                    if (shouldTranslateVideoLanguage(targetLang)) {
                        if (ctx.translatedUrl != null && !ctx.translatedUrl.isBlank()) {
                            resultUrl = ctx.translatedUrl;
                        } else {
                            if (ctx.providerTranslateId == null || ctx.providerTranslateId.isBlank()) {
                                Map<String, Object> tr = heyGenService.createVideoTranslation(resultUrl, targetLang);
                                String newId = tr.get("video_translate_id") == null ? null : String.valueOf(tr.get("video_translate_id"));
                                if (newId == null || newId.isBlank()) {
                                    return ResponseEntity.ok(new VideoPreviewResponse(true, videoId, "failed", type, null, "HeyGen translate started but id is empty"));
                                }
                                ctx.providerTranslateId = newId;
                                return ResponseEntity.ok(new VideoPreviewResponse(true, videoId, "processing", type, null, null));
                            }

                            Map<String, Object> trStatus = heyGenService.getVideoTranslationStatus(ctx.providerTranslateId);
                            String ts = trStatus.get("status") == null ? null : String.valueOf(trStatus.get("status"));
                            String tUrl = trStatus.get("video_url") == null ? null : String.valueOf(trStatus.get("video_url"));
                            String tErr = trStatus.get("error") == null ? null : String.valueOf(trStatus.get("error"));

                            if (ts != null && ts.trim().equalsIgnoreCase("completed")) {
                                if (tUrl == null || tUrl.isBlank()) {
                                    return ResponseEntity.ok(new VideoPreviewResponse(true, videoId, "failed", type, null, "HeyGen translate completed but video_url is empty"));
                                }
                                ctx.translatedUrl = tUrl;
                                resultUrl = tUrl;
                            } else if (ts != null && (ts.trim().equalsIgnoreCase("failed") || ts.trim().equalsIgnoreCase("error"))) {
                                return ResponseEntity.ok(new VideoPreviewResponse(true, videoId, "failed", type, null, tErr == null || tErr.isBlank() ? "HeyGen translate failed" : tErr));
                            } else {
                                return ResponseEntity.ok(new VideoPreviewResponse(true, videoId, "processing", type, null, tErr));
                            }
                        }
                    }

                    if (ctx.useBackground && ctx.backgroundName != null && !ctx.backgroundName.isBlank()) {
                        if (ctx.compositedUrl != null && !ctx.compositedUrl.isBlank()) {
                            resultUrl = ctx.compositedUrl;
                        } else {
                            java.util.Optional<String> composited = videoBackgroundCompositeService
                                    .compositeToStoredVideoUrl(resultUrl, ctx.backgroundName, backendUrl, serverContextPath);
                            if (composited.isPresent() && !composited.get().isBlank()) {
                                ctx.compositedUrl = composited.get();
                                resultUrl = ctx.compositedUrl;
                            }
                        }
                    }
                }
            }

            return ResponseEntity.ok(new VideoPreviewResponse(true, videoId, s, type, resultUrl, err));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new VideoPreviewResponse(false, videoId, null, null, null, e.getMessage()));
        }
    }

    private void cleanupPreviewContexts() {
        long now = System.currentTimeMillis();
        previewContexts.entrySet().removeIf(e -> now - e.getValue().createdAtMs > PREVIEW_CONTEXT_TTL_MS);
    }

    @GetMapping("/avatars")
    public ResponseEntity<List<VideoAvatarOption>> getAvatars(
            @RequestParam(name = "avatarId", required = false) String avatarId,
            @RequestParam(name = "avatar_id", required = false) String avatarIdSnake
    ) {
        // Return avatars created/owned by this HeyGen account by default (public/premium can be
        // enabled via configuration).
        List<Map<String, Object>> avatars = heyGenService.listAvatars();
        List<VideoAvatarOption> out = new java.util.ArrayList<>();
        if (avatars != null) {
            for (Map<String, Object> a : avatars) {
                if (a == null) {
                    continue;
                }
                out.add(new VideoAvatarOption(
                        a.get("avatar_id") == null ? null : String.valueOf(a.get("avatar_id")),
                        a.get("display_name") == null ? null : String.valueOf(a.get("display_name")),
                        a.get("avatar_name") == null ? null : String.valueOf(a.get("avatar_name")),
                        a.get("gender") == null ? null : String.valueOf(a.get("gender")),
                        a.get("thumbnail_url") == null ? null : String.valueOf(a.get("thumbnail_url")),
                        a.get("preview_url") == null ? null : String.valueOf(a.get("preview_url")),
                        a.get("is_premium") == null ? null : Boolean.valueOf(String.valueOf(a.get("is_premium"))),
                        a.get("type") == null ? null : String.valueOf(a.get("type"))
                ));
            }
        }

        out.sort(java.util.Comparator.comparing(
                v -> (v.getDisplay_name() == null ? "" : v.getDisplay_name()).toLowerCase(java.util.Locale.ROOT)
        ));
        return ResponseEntity.ok(out);
    }

    // Backward compatible alias (no D-ID dependency).
    @GetMapping("/presenters")
    public ResponseEntity<List<VideoAvatarOption>> getPresentersAlias(
            @RequestParam(name = "avatarId", required = false) String avatarId,
            @RequestParam(name = "avatar_id", required = false) String avatarIdSnake
    ) {
        return getAvatars(avatarId, avatarIdSnake);
    }

    @GetMapping("/voices")
    public ResponseEntity<List<Map<String, Object>>> getVoices() {
        return ResponseEntity.ok(heyGenService.listVoices());
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
                    // Avatar may be an id or a friendly name; use as-is in exports.
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
    public ResponseEntity<VideoReportResponse> createVideoReport(
            @RequestBody VideoReportRequest request,
            @RequestHeader(value = "Authorization", required = false) String token
    ) {
        User currentUser = getCurrentUser(token);
        VideoReport report = videoReportService.createVideoReport(request, currentUser);

        // Start async video generation (skip for preview reports)
        if (!Boolean.TRUE.equals(request.getPreview())) {
            videoReportService.startVideoGeneration(report.getId());
        }
        
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
     * Regenerate single video item
     */
    @PostMapping("/{reportId}/items/{itemId}/regenerate-video")
    public ResponseEntity<Map<String, Object>> regenerateVideo(
            @PathVariable Long reportId,
            @PathVariable Long itemId) {
        try {
            VideoReportItem item = videoReportService.regenerateVideo(reportId, itemId);
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
     * Regenerate all failed video items in a report with auto WA send
     */
    @PostMapping("/{id}/regenerate-failed-videos")
    public ResponseEntity<Map<String, Object>> regenerateFailedVideos(@PathVariable Long id) {
        try {
            int count = videoReportService.regenerateAllFailedVideos(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Regenerating " + count + " failed videos. WA will be sent automatically when successful.");
            response.put("count", count);
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
        response.put("providerVideoId", item.getProviderVideoId());
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

    private Long[] resolveTokenToIds(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        try {
            java.util.List<Long[]> candidates = VideoLinkEncryptor.decryptVideoLinkShortCandidates(token);
            if (candidates != null && !candidates.isEmpty()) {
                for (Long[] ids : candidates) {
                    if (ids == null || ids.length < 2) {
                        continue;
                    }
                    VideoReportItem item = videoReportItemRepository.findByIdAndVideoReportId(ids[1], ids[0]);
                    if (item != null) {
                        return ids;
                    }
                }
            }
        } catch (Exception ignore) {
        }

        Long[] ids = VideoLinkEncryptor.decryptVideoLink(token);
        if (ids == null || ids.length < 2) {
            return null;
        }
        try {
            VideoReportItem item = videoReportItemRepository.findByIdAndVideoReportId(ids[1], ids[0]);
            return item == null ? null : ids;
        } catch (Exception ignore) {
            return null;
        }
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
        String shareUrl = videoReportService.getPublicVideoShareUrl(reportId, itemId);
        response.put("shareUrl", (shareUrl == null || shareUrl.isBlank()) ? ("/v/" + token) : shareUrl);
        return ResponseEntity.ok(response);
    }

    /**
     * Get video info by encrypted token (public endpoint - no auth required)
     * This endpoint is used for viewing shared videos
     */
    @GetMapping("/view/{token}")
    public ResponseEntity<Map<String, Object>> getVideoByToken(@PathVariable String token, HttpServletRequest request) {
        Long[] ids = resolveTokenToIds(token);
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

        // Always prefer local stream endpoint (serves cached local file within retention window)
        String ctx = "";
        try {
            ctx = request == null ? "" : request.getContextPath();
            if (ctx == null) ctx = "";
        } catch (Exception ignored) {
            ctx = "";
        }

        String videoUrl = null;
        if (item.getVideoUrl() != null && !item.getVideoUrl().isBlank() && "DONE".equals(item.getStatus())) {
            videoUrl = ctx + "/api/video-reports/stream/" + token + ".mp4";
        }
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
    public void streamVideoByToken(@PathVariable String token, HttpServletRequest request, HttpServletResponse response) {
        String sourceUrl = null;
        Long reportId;
        Long itemId;
        try {
            Long[] ids = resolveTokenToIds(token);
            if (ids == null || ids.length < 2) {
                response.setStatus(HttpStatus.BAD_REQUEST.value());
                return;
            }

            reportId = ids[0];
            itemId = ids[1];

            VideoReportItem item = videoReportItemRepository.findByIdAndVideoReportId(itemId, reportId);
            if (item == null) {
                response.setStatus(HttpStatus.NOT_FOUND.value());
                return;
            }

            sourceUrl = item.getVideoUrl();
            if (sourceUrl == null || sourceUrl.isBlank()) {
                response.setStatus(HttpStatus.NOT_FOUND.value());
                return;
            }

            boolean withinRetention = true;
            try {
                if (videoCacheRetentionDays > 0 && item.getVideoGeneratedAt() != null) {
                    withinRetention = item.getVideoGeneratedAt().isAfter(java.time.LocalDateTime.now().minusDays(videoCacheRetentionDays));
                }
            } catch (Exception ignore) {
            }

            if (!withinRetention) {
                redirectToSource(response, sourceUrl);
                return;
            }

            Path filePath = Paths.get(videoShareDir, token + ".mp4");
            if (!Files.exists(filePath) || !Files.isReadable(filePath)) {
                boolean cached;
                try {
                    cached = videoReportService.cacheVideoBlockingIfNeeded(reportId, itemId, sourceUrl);
                } catch (Exception ignore) {
                    cached = false;
                }

                if (!cached) {
                    try {
                        videoReportService.enqueueShareCacheDownloadIfNeeded(reportId, itemId, sourceUrl);
                    } catch (Exception ignore) {
                    }
                    redirectToSource(response, sourceUrl);
                    return;
                }
            }

            if (!Files.exists(filePath) || !Files.isReadable(filePath)) {
                redirectToSource(response, sourceUrl);
                return;
            }

            try {
                videoReportService.ensureCachedVideoAudioBoostedIfNeeded(token, filePath);
            } catch (Exception ignore) {
            }

            long fileSize = Files.size(filePath);
            if (fileSize <= 0) {
                redirectToSource(response, sourceUrl);
                return;
            }

            if (videoCacheRetentionDays > 0) {
                try {
                    java.nio.file.attribute.FileTime ft = Files.getLastModifiedTime(filePath);
                    if (ft != null) {
                        long cutoffMs = System.currentTimeMillis() - (videoCacheRetentionDays * 24L * 60L * 60L * 1000L);
                        if (ft.toMillis() < cutoffMs) {
                            Files.deleteIfExists(filePath);
                            redirectToSource(response, sourceUrl);
                            return;
                        }
                    }
                } catch (Exception ignore) {
                }
            }

            response.setHeader(HttpHeaders.ACCEPT_RANGES, "bytes");
            boolean downloadRequested = false;
            try {
                String downloadParam = request == null ? null : request.getParameter("download");
                downloadRequested = "1".equals(downloadParam) || "true".equalsIgnoreCase(downloadParam);
            } catch (Exception ignore) {
                downloadRequested = false;
            }

            String filename = "cemoca-" + token + ".mp4";
            String dispositionType = downloadRequested ? "attachment" : "inline";
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, dispositionType + "; filename=\"" + filename + "\"");
            response.setHeader(HttpHeaders.CACHE_CONTROL, "private, max-age=3600");
            response.setContentType("video/mp4");

            boolean isHead = request != null && "HEAD".equalsIgnoreCase(request.getMethod());
            String range = request == null ? null : request.getHeader(HttpHeaders.RANGE);

            long start = 0;
            long end = fileSize - 1;
            boolean partial = false;

            if (range != null && range.startsWith("bytes=")) {
                String spec = range.substring("bytes=".length()).trim();
                int dash = spec.indexOf('-');
                if (dash >= 0) {
                    String startPart = spec.substring(0, dash).trim();
                    String endPart = spec.substring(dash + 1).trim();
                    try {
                        if (!startPart.isEmpty()) {
                            start = Long.parseLong(startPart);
                        }
                        if (!endPart.isEmpty()) {
                            end = Long.parseLong(endPart);
                        }
                        if (startPart.isEmpty() && !endPart.isEmpty()) {
                            long suffixLen = Long.parseLong(endPart);
                            if (suffixLen > 0) {
                                start = Math.max(0, fileSize - suffixLen);
                                end = fileSize - 1;
                            }
                        }
                        if (start < 0) start = 0;
                        if (end >= fileSize) end = fileSize - 1;
                        if (start <= end) {
                            partial = true;
                        }
                    } catch (Exception ignore) {
                        start = 0;
                        end = fileSize - 1;
                        partial = false;
                    }
                }
            }

            long contentLength = (end - start) + 1;
            if (partial) {
                response.setStatus(HttpStatus.PARTIAL_CONTENT.value());
                response.setHeader(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + fileSize);
                response.setHeader(HttpHeaders.CONTENT_LENGTH, String.valueOf(contentLength));
            } else {
                response.setStatus(HttpStatus.OK.value());
                response.setHeader(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileSize));
            }

            if (isHead) {
                return;
            }

            try (RandomAccessFile raf = new RandomAccessFile(filePath.toFile(), "r"); OutputStream out = response.getOutputStream()) {
                raf.seek(start);
                byte[] buffer = new byte[8192];
                long remaining = partial ? contentLength : fileSize;
                while (remaining > 0) {
                    int read = raf.read(buffer, 0, (int) Math.min(buffer.length, remaining));
                    if (read < 0) {
                        break;
                    }
                    out.write(buffer, 0, read);
                    remaining -= read;
                }
            }
        } catch (Exception e) {
            try {
                if (sourceUrl != null && !sourceUrl.isBlank()) {
                    redirectToSource(response, sourceUrl);
                } else {
                    response.setStatus(HttpStatus.NOT_FOUND.value());
                }
            } catch (Exception ignore) {
            }
        }
    }

    private void redirectToSource(HttpServletResponse response, String sourceUrl) throws IOException {
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        response.setHeader(HttpHeaders.LOCATION, sourceUrl);
        response.setStatus(HttpStatus.FOUND.value());
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
            User currentUser = getCurrentUser(httpRequest == null ? null : httpRequest.getHeader("Authorization"));
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
     * Wablas API requires phone format: E.164 digits (without + prefix)
     */
    @GetMapping("/wa/debug-phone/{phone}")
    public ResponseEntity<Map<String, Object>> debugPhoneFormat(@PathVariable String phone) {
        Map<String, Object> result = new HashMap<>();
        result.put("originalPhone", phone);
        result.put("formattedPhone", whatsAppService.formatPhoneForDebug(phone));
        result.put("wablasRequiredFormat", "E.164 digits (tanpa + di depan)");
        result.put("example", "6285600121760 / 60167100088");
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

    private User getCurrentUser(String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return null;
            }
            String actualToken = token.substring(7);
            return authService.getUserFromToken(actualToken);
        } catch (Exception ignored) {
            return null;
        }
    }
}
