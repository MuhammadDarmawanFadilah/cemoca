package com.shadcn.backend.service;

import com.shadcn.backend.dto.ExcelValidationResult;
import com.shadcn.backend.dto.VideoReportRequest;
import com.shadcn.backend.dto.VideoReportResponse;
import com.shadcn.backend.dto.VideoReportResponse.VideoReportItemResponse;
import com.shadcn.backend.model.User;
import com.shadcn.backend.entity.VideoReport;
import com.shadcn.backend.entity.VideoReportItem;
import com.shadcn.backend.repository.VideoReportItemRepository;
import com.shadcn.backend.repository.VideoReportRepository;
import com.shadcn.backend.util.VideoLinkEncryptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.annotation.PostConstruct;

@Service
public class VideoReportService {
    private static final Logger logger = LoggerFactory.getLogger(VideoReportService.class);

    private final VideoReportRepository videoReportRepository;
    private final VideoReportItemRepository videoReportItemRepository;
    private final DIDService didService;
    private final ExcelService excelService;
    private final WhatsAppService whatsAppService;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;

    @Value("${server.servlet.context-path:}")
    private String serverContextPath;

    @Value("${app.video.generation.parallelism}")
    private int videoGenerationParallelism;

    @Value("${app.video.generation.batch-size}")
    private int videoGenerationBatchSize;

    @Value("${app.video.generation.batch-delay-ms}")
    private long videoGenerationBatchDelayMs;

    @Value("${app.video.temp-dir}")
    private String videoTempDir;

    @Value("${app.video.share-dir}")
    private String videoShareDir;

    @Value("${app.video.download.max-bytes}")
    private int videoDownloadMaxBytes;

    @Value("${app.video.download.connect-timeout-seconds}")
    private int videoDownloadConnectTimeoutSeconds;

    @Value("${app.video.download.read-timeout-seconds}")
    private int videoDownloadReadTimeoutSeconds;

    @Value("${app.wa.retry.delay-ms}")
    private long waRetryDelayMs;

    @PostConstruct
    void validateVideoStorageConfig() {
        if (videoGenerationParallelism <= 0) {
            throw new IllegalStateException("Invalid property app.video.generation.parallelism; must be > 0");
        }
        if (videoGenerationBatchSize <= 0) {
            throw new IllegalStateException("Invalid property app.video.generation.batch-size; must be > 0");
        }
        if (videoGenerationBatchDelayMs < 0) {
            throw new IllegalStateException("Invalid property app.video.generation.batch-delay-ms; must be >= 0");
        }
        if (videoTempDir == null || videoTempDir.isBlank()) {
            throw new IllegalStateException("Missing required property: app.video.temp-dir");
        }
        if (videoShareDir == null || videoShareDir.isBlank()) {
            throw new IllegalStateException("Missing required property: app.video.share-dir");
        }
        if (videoDownloadMaxBytes <= 0) {
            throw new IllegalStateException("Invalid property app.video.download.max-bytes; must be > 0");
        }
        if (videoDownloadConnectTimeoutSeconds <= 0) {
            throw new IllegalStateException("Invalid property app.video.download.connect-timeout-seconds; must be > 0");
        }
        if (videoDownloadReadTimeoutSeconds <= 0) {
            throw new IllegalStateException("Invalid property app.video.download.read-timeout-seconds; must be > 0");
        }
        if (waRetryDelayMs <= 0) {
            throw new IllegalStateException("Invalid property app.wa.retry.delay-ms; must be > 0");
        }
    }

    public VideoReportService(VideoReportRepository videoReportRepository,
                             VideoReportItemRepository videoReportItemRepository,
                             DIDService didService,
                             ExcelService excelService,
                             WhatsAppService whatsAppService) {
        this.videoReportRepository = videoReportRepository;
        this.videoReportItemRepository = videoReportItemRepository;
        this.didService = didService;
        this.excelService = excelService;
        this.whatsAppService = whatsAppService;
    }

    /**
     * Get default message template from resources
     */
    public String getDefaultMessageTemplate() {
        try {
            ClassPathResource resource = new ClassPathResource("video/personalsales.txt");
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                return reader.lines().collect(Collectors.joining("\n"));
            }
        } catch (Exception e) {
            logger.error("Error reading default message template: {}", e.getMessage());
            return "Selamat ulang tahun, :name! Semoga sukses selalu.";
        }
    }
    
    /**
     * Get default WA message template
     */
    public String getDefaultWaMessageTemplate() {
        return "Halo :name!\n\nKami punya video spesial untuk Anda.\n\nTerima kasih!";
    }

    /**
     * Validate uploaded Excel file
     */
    public ExcelValidationResult validateExcel(MultipartFile file) {
        return excelService.parseAndValidateExcel(file);
    }

    /**
     * Get all items by report ID (for export)
     */
    public List<VideoReportItem> getAllItemsByReportId(Long reportId) {
        return videoReportItemRepository.findByVideoReportIdOrderByRowNumberAsc(reportId);
    }

    /**
     * Create video report from request
     */
    @Transactional
    public VideoReport createVideoReport(VideoReportRequest request, User user) {
        VideoReport report = new VideoReport();
        report.setReportName(request.getReportName());
        report.setMessageTemplate(request.getMessageTemplate());
        report.setWaMessageTemplate(request.getWaMessageTemplate());
        report.setStatus("PENDING");
        report.setTotalRecords(request.getItems().size());
        report.setCreatedBy(user);
        
        report = videoReportRepository.save(report);

        // Create items
        for (VideoReportRequest.VideoReportItemRequest itemRequest : request.getItems()) {
            VideoReportItem item = new VideoReportItem();
            item.setVideoReport(report);
            item.setRowNumber(itemRequest.getRowNumber());
            item.setName(itemRequest.getName());
            item.setPhone(itemRequest.getPhone());
            item.setAvatar(itemRequest.getAvatar());
            
            // Generate personalized message
            String personalizedMessage = request.getMessageTemplate()
                    .replace(":name", itemRequest.getName());
            item.setPersonalizedMessage(personalizedMessage);
            item.setStatus("PENDING");
            item.setWaStatus("PENDING");
            item.setExcluded(false);
            
            videoReportItemRepository.save(item);
        }

        return report;
    }

    /**
     * Start video generation process with parallel processing
     * Uses configurable parallelism to handle 1000+ videos efficiently
     * D-ID API supports "tens of thousands of requests in parallel" (100 FPS rendering)
     */
    @Async
    @Transactional
    public void startVideoGeneration(Long reportId) {
        VideoReport report = videoReportRepository.findById(reportId).orElse(null);
        if (report == null) {
            logger.error("Video report not found: {}", reportId);
            return;
        }

        report.setStatus("PROCESSING");
        videoReportRepository.save(report);

        List<VideoReportItem> items = videoReportItemRepository
                .findByVideoReportIdOrderByRowNumberAsc(reportId);
        
        // Filter out excluded and already processed items
        List<VideoReportItem> pendingItems = items.stream()
                .filter(item -> !Boolean.TRUE.equals(item.getExcluded()))
                .filter(item -> "PENDING".equals(item.getStatus()) || "FAILED".equals(item.getStatus()))
                .collect(Collectors.toList());
        
        logger.info("[VIDEO GEN] ========================================");
        logger.info("[VIDEO GEN] Starting video generation for report {}", reportId);
        logger.info("[VIDEO GEN] Total items: {}, Pending items: {}", items.size(), pendingItems.size());
        logger.info("[VIDEO GEN] Parallelism: {}, Batch size: {}", videoGenerationParallelism, videoGenerationBatchSize);
        logger.info("[VIDEO GEN] ========================================");
        
        if (pendingItems.isEmpty()) {
            logger.info("[VIDEO GEN] No pending items to process");
            checkAndUpdateReportStatus(reportId);
            return;
        }
        
        // Create thread pool for parallel processing
        ExecutorService executor = Executors.newFixedThreadPool(videoGenerationParallelism);
        
        try {
            // Process in batches to save progress periodically
            List<List<VideoReportItem>> batches = splitIntoBatches(pendingItems, videoGenerationBatchSize);
            int batchNumber = 0;
            
            for (List<VideoReportItem> batch : batches) {
                batchNumber++;
                logger.info("[VIDEO GEN] Processing batch {}/{} ({} items)", batchNumber, batches.size(), batch.size());
                
                // Submit all items in batch for parallel processing
                List<CompletableFuture<VideoReportItem>> futures = batch.stream()
                        .map(item -> CompletableFuture.supplyAsync(() -> processVideoItem(item), executor))
                        .collect(Collectors.toList());
                
                // Wait for all items in batch to complete
                CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
                
                // Update report progress
                VideoReport currentReport = videoReportRepository.findById(reportId).orElse(null);
                if (currentReport != null) {
                    int processed = (int) items.stream()
                            .filter(i -> !"PENDING".equals(i.getStatus()))
                            .count();
                    int failed = (int) items.stream()
                            .filter(i -> "FAILED".equals(i.getStatus()))
                            .count();
                    
                    currentReport.setProcessedRecords(processed);
                    currentReport.setFailedCount(failed);
                    videoReportRepository.save(currentReport);
                    
                    logger.info("[VIDEO GEN] Batch {}/{} complete - Processed: {}, Failed: {}", 
                            batchNumber, batches.size(), processed, failed);
                }
                
                // Small delay between batches
                if (batchNumber < batches.size()) {
                    if (videoGenerationBatchDelayMs > 0) {
                        Thread.sleep(videoGenerationBatchDelayMs);
                    }
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.error("[VIDEO GEN] Interrupted during video generation: {}", e.getMessage());
        } finally {
            executor.shutdown();
            try {
                if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                    executor.shutdownNow();
                }
            } catch (InterruptedException e) {
                executor.shutdownNow();
            }
        }

        // Update report status
        checkAndUpdateReportStatus(reportId);
        
        // Get final status
        VideoReport finalReport = videoReportRepository.findById(reportId).orElse(null);
        
        logger.info("[VIDEO GEN] ========================================");
        logger.info("[VIDEO GEN] Completed video generation for report {}", reportId);
        logger.info("[VIDEO GEN] Status: {}", finalReport != null ? finalReport.getStatus() : "UNKNOWN");
        logger.info("[VIDEO GEN] WA blast will be sent by scheduler automatically");
        logger.info("[VIDEO GEN] ========================================");
    }
    
    /**
     * Process a single video item (called in parallel)
     */
    private VideoReportItem processVideoItem(VideoReportItem item) {
        try {
            // Convert avatar name to presenter ID
            String presenterId = null;
            Optional<com.shadcn.backend.model.DIDAvatar> dbAvatar = didService.getAvatarByName(item.getAvatar());
            if (dbAvatar.isPresent()) {
                presenterId = dbAvatar.get().getPresenterId();
                logger.debug("[VIDEO GEN] Item {} - Avatar '{}' found in DB, presenter_id: '{}'", 
                    item.getId(), item.getAvatar(), presenterId);
            } else {
                presenterId = didService.getPresenterIdByName(item.getAvatar());
            }
            
            if (presenterId == null) {
                presenterId = item.getAvatar();
                logger.warn("[VIDEO GEN] Item {} - Avatar '{}' not found, using as direct ID", 
                    item.getId(), item.getAvatar());
            }
            
            // Create clip via D-ID
            Map<String, Object> result = didService.createClip(
                    presenterId,
                    item.getPersonalizedMessage()
            );

            if ((Boolean) result.get("success")) {
                item.setDidClipId((String) result.get("id"));
                item.setStatus("PROCESSING");
                logger.info("[VIDEO GEN] Item {} - D-ID clip created: {}", item.getId(), result.get("id"));
            } else {
                item.setStatus("FAILED");
                item.setErrorMessage((String) result.get("error"));
                logger.error("[VIDEO GEN] Item {} - D-ID failed: {}", item.getId(), result.get("error"));
            }
        } catch (Exception e) {
            logger.error("[VIDEO GEN] Item {} - Exception: {}", item.getId(), e.getMessage());
            item.setStatus("FAILED");
            item.setErrorMessage(e.getMessage());
        }

        videoReportItemRepository.save(item);
        return item;
    }
    
    /**
     * Split list into batches
     */
    private <T> List<List<T>> splitIntoBatches(List<T> items, int batchSize) {
        List<List<T>> batches = new ArrayList<>();
        for (int i = 0; i < items.size(); i += batchSize) {
            int end = Math.min(i + batchSize, items.size());
            batches.add(new ArrayList<>(items.subList(i, end)));
        }
        return batches;
    }
    
    /**
     * Generate video for a single item
     */
    @Transactional
    public VideoReportItem generateSingleVideo(Long reportId, Long itemId) {
        VideoReportItem item = videoReportItemRepository.findByIdAndVideoReportId(itemId, reportId);
        if (item == null) {
            throw new RuntimeException("Item not found");
        }
        
        VideoReport report = videoReportRepository.findById(reportId).orElse(null);
        if (report == null) {
            throw new RuntimeException("Report not found");
        }
        
        try {
            // Reset item status
            item.setStatus("PENDING");
            item.setVideoUrl(null);
            item.setErrorMessage(null);
            item.setDidClipId(null);
            videoReportItemRepository.save(item);
            
            // Convert avatar name to presenter ID
            String presenterId = null;
            Optional<com.shadcn.backend.model.DIDAvatar> dbAvatar = didService.getAvatarByName(item.getAvatar());
            if (dbAvatar.isPresent()) {
                presenterId = dbAvatar.get().getPresenterId();
            } else {
                presenterId = didService.getPresenterIdByName(item.getAvatar());
            }
            
            if (presenterId == null) {
                presenterId = item.getAvatar();
            }
            
            // Create clip via D-ID
            Map<String, Object> result = didService.createClip(
                    presenterId,
                    item.getPersonalizedMessage()
            );

            if ((Boolean) result.get("success")) {
                item.setDidClipId((String) result.get("id"));
                item.setStatus("PROCESSING");
            } else {
                item.setStatus("FAILED");
                item.setErrorMessage((String) result.get("error"));
            }
            
            videoReportItemRepository.save(item);
            checkAndUpdateReportStatus(reportId);
            
            return item;
        } catch (Exception e) {
            logger.error("Error generating single video for item {}: {}", itemId, e.getMessage());
            item.setStatus("FAILED");
            item.setErrorMessage(e.getMessage());
            videoReportItemRepository.save(item);
            throw new RuntimeException("Failed to generate video: " + e.getMessage());
        }
    }
    
    /**
     * Exclude/include item from video generation
     */
    @Transactional
    public VideoReportItem toggleExcludeItem(Long reportId, Long itemId) {
        VideoReportItem item = videoReportItemRepository.findByIdAndVideoReportId(itemId, reportId);
        if (item == null) {
            throw new RuntimeException("Item not found");
        }
        
        item.setExcluded(!Boolean.TRUE.equals(item.getExcluded()));
        videoReportItemRepository.save(item);
        
        return item;
    }
    
    /**
     * Delete video for a single item
     */
    @Transactional
    public VideoReportItem deleteItemVideo(Long reportId, Long itemId) {
        VideoReportItem item = videoReportItemRepository.findByIdAndVideoReportId(itemId, reportId);
        if (item == null) {
            throw new RuntimeException("Item not found");
        }
        
        item.setStatus("PENDING");
        item.setVideoUrl(null);
        item.setDidClipId(null);
        item.setErrorMessage(null);
        videoReportItemRepository.save(item);
        
        checkAndUpdateReportStatus(reportId);
        
        return item;
    }
    
    /**
     * Delete all videos in a report and reset
     */
    @Transactional
    public void deleteAllVideos(Long reportId) {
        List<VideoReportItem> items = videoReportItemRepository.findByVideoReportIdOrderByRowNumberAsc(reportId);
        
        for (VideoReportItem item : items) {
            item.setStatus("PENDING");
            item.setVideoUrl(null);
            item.setDidClipId(null);
            item.setErrorMessage(null);
            videoReportItemRepository.save(item);
        }
        
        VideoReport report = videoReportRepository.findById(reportId).orElse(null);
        if (report != null) {
            report.setStatus("PENDING");
            report.setProcessedRecords(0);
            report.setSuccessCount(0);
            report.setFailedCount(0);
            report.setCompletedAt(null);
            videoReportRepository.save(report);
        }
    }
    
    // Lock per report untuk mencegah concurrent WA blast
    private static final java.util.concurrent.ConcurrentHashMap<Long, java.util.concurrent.locks.ReentrantLock> waBlastLocks = new java.util.concurrent.ConcurrentHashMap<>();
    
    private java.util.concurrent.locks.ReentrantLock getWaBlastLock(Long reportId) {
        return waBlastLocks.computeIfAbsent(reportId, k -> new java.util.concurrent.locks.ReentrantLock());
    }
    
    /**
     * Start WhatsApp blast for completed videos
     * BACKGROUND method with proper locking per report
     * 1. Lock report to prevent concurrent processing
     * 2. Mark items as PROCESSING immediately
     * 3. Send WA messages
     * 4. Update status to SENT/FAILED
     */
    @Async
    public void startWaBlast(Long reportId) {
        java.util.concurrent.locks.ReentrantLock lock = getWaBlastLock(reportId);
        
        // Try to acquire lock - if already locked, skip (another process is handling this report)
        if (!lock.tryLock()) {
            logger.info("[WA BLAST VIDEO] Report {} is already being processed, skipping", reportId);
            return;
        }
        
        try {
            try {
                processWaBlastForReport(reportId);
            } catch (Exception e) {
                logger.error("[WA BLAST VIDEO] Fatal error while processing report {}: {}", reportId, e.getMessage(), e);
                markAllReadyWaItemsAsError(reportId, "WA blast fatal error: " + e.getMessage());
            }
        } finally {
            lock.unlock();
        }
    }

    private void markAllReadyWaItemsAsError(Long reportId, String message) {
        try {
            List<VideoReportItem> items = videoReportItemRepository.findReadyForWaBlast(reportId);
            for (VideoReportItem item : items) {
                item.setWaStatus("ERROR");
                item.setWaErrorMessage(message);
                videoReportItemRepository.save(item);
            }
        } catch (Exception ignored) {
        }
    }
    
    /**
     * Internal method to process WA blast for a report
     * Must be called while holding the lock
     */
    private void processWaBlastForReport(Long reportId) {
        logger.info("[WA BLAST VIDEO] ========================================");
        logger.info("[WA BLAST VIDEO] STARTING WA BLAST FOR REPORT {}", reportId);
        logger.info("[WA BLAST VIDEO] ========================================");
        
        VideoReport report = videoReportRepository.findById(reportId).orElse(null);
        if (report == null) {
            logger.error("[WA BLAST VIDEO] Video report not found: {}", reportId);
            return;
        }
        
        // STEP 1: Find items ready for WA blast (status=DONE, waStatus=PENDING only)
        List<VideoReportItem> readyItems = videoReportItemRepository.findReadyForWaBlast(reportId);
        
        if (readyItems.isEmpty()) {
            logger.info("[WA BLAST VIDEO] No items ready for WA blast (PENDING)");
            return;
        }
        
        logger.info("[WA BLAST VIDEO] Found {} items ready for WA blast", readyItems.size());
        
        // STEP 2: Mark ALL items as PROCESSING immediately to prevent re-pickup by scheduler
        for (VideoReportItem item : readyItems) {
            item.setWaStatus("PROCESSING");
            videoReportItemRepository.save(item);
        }
        videoReportItemRepository.flush(); // Force flush to DB immediately
        
        logger.info("[WA BLAST VIDEO] Marked {} items as PROCESSING", readyItems.size());
        
        // STEP 3: Send per-item using local video file (Wablas send-video-from-local)
        int successCount = 0;
        int failCount = 0;

        for (VideoReportItem item : readyItems) {
            try {
                String waTemplate = report.getWaMessageTemplate();
                if (waTemplate == null || waTemplate.isEmpty()) {
                    waTemplate = getDefaultWaMessageTemplate();
                }

                String caption = waTemplate
                        .replace(":name", item.getName() == null ? "" : item.getName())
                        .replace(":linkvideo", "");

                Path tempPath = getTempVideoPath(reportId, item.getId());
                Path sharePath = getShareVideoPath(reportId, item.getId());
                ensureTempVideoExists(item, tempPath, sharePath);

                String fallbackUrl = buildPublicVideoStreamUrl(reportId, item.getId());

                Map<String, Object> waResult = whatsAppService.sendVideoFileFromLocalWithDetailsOrUrl(
                    item.getPhone(),
                    caption,
                    tempPath,
                    fallbackUrl
                );

                boolean ok = Boolean.TRUE.equals(waResult.get("success"));
                String messageId = Objects.toString(waResult.get("messageId"), null);
                String messageStatus = Objects.toString(waResult.get("messageStatus"), null);

                if (ok) {
                    boolean queued = messageStatus != null && messageStatus.equalsIgnoreCase("pending");
                    if (queued) {
                        item.setWaStatus("QUEUED");
                    } else if (messageStatus != null && (messageStatus.equalsIgnoreCase("delivered") || messageStatus.equalsIgnoreCase("read"))) {
                        item.setWaStatus("DELIVERED");
                        successCount++;
                    } else {
                        item.setWaStatus("SENT");
                        successCount++;
                    }

                    item.setWaMessageId(messageId);
                    item.setWaSentAt(LocalDateTime.now());
                    item.setWaErrorMessage(null);

                    // delete local video after WA accepted
                    try {
                        Files.deleteIfExists(tempPath);
                    } catch (Exception ignored) {
                    }
                } else {
                    item.setWaStatus("ERROR");
                    item.setWaMessageId(messageId);
                    item.setWaErrorMessage(Objects.toString(waResult.get("error"), null));
                    failCount++;
                }

                videoReportItemRepository.save(item);
            } catch (Exception e) {
                item.setWaStatus("ERROR");
                item.setWaErrorMessage(e.getMessage());
                failCount++;
                videoReportItemRepository.save(item);
            }
        }
        
        // STEP 6: Update report counters
        Integer currentWaSentCountObj = java.util.Objects.requireNonNullElse(report.getWaSentCount(), 0);
        Integer currentWaFailedCountObj = java.util.Objects.requireNonNullElse(report.getWaFailedCount(), 0);
        int currentWaSentCount = currentWaSentCountObj.intValue();
        int currentWaFailedCount = currentWaFailedCountObj.intValue();
        report.setWaSentCount(currentWaSentCount + successCount);
        report.setWaFailedCount(currentWaFailedCount + failCount);
        videoReportRepository.save(report);
        
        logger.info("[WA BLAST VIDEO] ========================================");
        logger.info("[WA BLAST VIDEO] COMPLETED: {} sent, {} failed", successCount, failCount);
        logger.info("[WA BLAST VIDEO] ========================================");
    }

    private Path getTempVideoPath(Long reportId, Long itemId) {
        return Paths.get(videoTempDir, "report-" + reportId, "item-" + itemId + ".mp4");
    }

    private Path getShareVideoPath(Long reportId, Long itemId) {
        return Paths.get(videoShareDir, "report-" + reportId, "item-" + itemId + ".mp4");
    }

    private void ensureTempVideoExists(VideoReportItem item, Path tempPath, Path sharePath) throws IOException, InterruptedException {
        if (Files.exists(tempPath) && Files.size(tempPath) > 0) {
            return;
        }

        if (Files.exists(sharePath) && Files.size(sharePath) > 0) {
            Files.createDirectories(tempPath.getParent());
            Files.copy(sharePath, tempPath, StandardCopyOption.REPLACE_EXISTING);
            return;
        }

        String sourceUrl = item.getVideoUrl();
        if (sourceUrl == null || sourceUrl.isBlank()) {
            throw new IOException("Video URL is empty; cannot download");
        }
        downloadToFile(
                sourceUrl,
                tempPath,
                videoDownloadMaxBytes,
                videoDownloadConnectTimeoutSeconds,
                videoDownloadReadTimeoutSeconds
        );

        Files.createDirectories(sharePath.getParent());
        Files.copy(tempPath, sharePath, StandardCopyOption.REPLACE_EXISTING);
    }

    private String buildPublicVideoStreamUrl(Long reportId, Long itemId) {
        String token = VideoLinkEncryptor.encryptVideoLink(reportId, itemId);
        if (token == null || token.isBlank()) {
            return null;
        }

        String base = backendUrl == null ? "" : backendUrl.trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }

        String ctx = serverContextPath == null ? "" : serverContextPath.trim();
        if (ctx.isEmpty() || "/".equals(ctx)) {
            ctx = "";
        } else if (!ctx.startsWith("/")) {
            ctx = "/" + ctx;
        }
        if (ctx.endsWith("/")) {
            ctx = ctx.substring(0, ctx.length() - 1);
        }

        return base + ctx + "/api/video-reports/stream/" + token + ".mp4";
    }

    private static void downloadToFile(
            String url,
            Path target,
            int maxBytes,
            int connectTimeoutSeconds,
            int readTimeoutSeconds
    ) throws IOException, InterruptedException {
        if (Files.exists(target) && Files.size(target) > 0) {
            return;
        }

        Files.createDirectories(target.getParent());

        HttpClient client = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(Math.max(1, connectTimeoutSeconds)))
                .build();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
            .timeout(Duration.ofSeconds(Math.max(1, readTimeoutSeconds)))
                .header("User-Agent", "Mozilla/5.0")
                .header("Accept", "video/*,*/*")
                .GET()
                .build();

        HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
        int status = response.statusCode();
        if (status < 200 || status >= 300) {
            throw new IOException("HTTP " + status + " when downloading video");
        }

        Path tmp = Files.createTempFile(target.getParent(), target.getFileName().toString(), ".part");
        try (InputStream in = response.body(); java.io.OutputStream out = Files.newOutputStream(tmp)) {
            byte[] buffer = new byte[8192];
            int total = 0;
            int read;
            while ((read = in.read(buffer)) != -1) {
                total += read;
                if (total > maxBytes) {
                    throw new IOException("Video too large (exceeds " + maxBytes + " bytes)");
                }
                out.write(buffer, 0, read);
            }

            if (total <= 0) {
                throw new IOException("Downloaded video is empty");
            }

            out.flush();
            Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } finally {
            try {
                Files.deleteIfExists(tmp);
            } catch (Exception ignored) {
            }
        }
    }
    
    /**
     * Resend WhatsApp to a single item with retry
     */
    @Transactional
    public VideoReportItem resendWa(Long reportId, Long itemId) {
        return resendWaWithRetry(reportId, itemId, 3);
    }
    
    /**
     * Resend WhatsApp to a single item with configurable retry attempts
     */
    public VideoReportItem resendWaWithRetry(Long reportId, Long itemId, int maxRetries) {
        VideoReportItem item = videoReportItemRepository.findByIdAndVideoReportId(itemId, reportId);
        if (item == null) {
            throw new RuntimeException("Item not found");
        }
        
        if (!"DONE".equals(item.getStatus())) {
            throw new RuntimeException("Video not ready yet");
        }
        
        VideoReport report = videoReportRepository.findById(reportId).orElse(null);
        if (report == null) {
            throw new RuntimeException("Report not found");
        }
        
        // Build WA caption
        String waTemplate = report.getWaMessageTemplate();
        if (waTemplate == null || waTemplate.isEmpty()) {
            waTemplate = getDefaultWaMessageTemplate();
        }

        String caption = waTemplate
            .replace(":name", item.getName() == null ? "" : item.getName())
            .replace(":linkvideo", "");
        
        String previousStatus = item.getWaStatus();
        Map<String, Object> waResult = new java.util.HashMap<>();
        boolean success = false;
        String lastError = null;
        
        // Retry loop
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            logger.info("[WA RESEND] Item {} - Attempt {}/{} to {}", itemId, attempt, maxRetries, item.getPhone());

            // Send WhatsApp VIDEO message with detailed response
            Map<String, Object> attemptResult;
            try {
                Path tempPath = getTempVideoPath(reportId, item.getId());
                Path sharePath = getShareVideoPath(reportId, item.getId());
                ensureTempVideoExists(item, tempPath, sharePath);

                String fallbackUrl = buildPublicVideoStreamUrl(reportId, item.getId());

                attemptResult = whatsAppService.sendVideoFileFromLocalWithDetailsOrUrl(
                        item.getPhone(),
                        caption,
                    tempPath,
                    fallbackUrl
                );

                if (Boolean.TRUE.equals(attemptResult.get("success"))) {
                    try {
                        Files.deleteIfExists(tempPath);
                    } catch (Exception ignored) {
                    }
                }
            } catch (Exception e) {
                attemptResult = new java.util.HashMap<>();
                attemptResult.put("success", false);
                attemptResult.put("error", e.getMessage());
            }
            waResult = attemptResult == null ? new java.util.HashMap<>() : attemptResult;

            success = Boolean.TRUE.equals(waResult.get("success"));
            
            if (success) {
                break;
            }
            
            lastError = java.util.Objects.toString(waResult.get("error"), null);
            
            // Check if error is retryable
            if (lastError != null && (
                lastError.toLowerCase().contains("not registered") ||
                lastError.toLowerCase().contains("invalid") ||
                lastError.toLowerCase().contains("blocked"))) {
                logger.warn("[WA RESEND] Item {} - Non-retryable error: {}", itemId, lastError);
                break;
            }
            
            if (attempt < maxRetries) {
                try {
                    Thread.sleep(waRetryDelayMs);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        
        String messageId = java.util.Objects.toString(waResult.get("messageId"), null);
        String messageStatus = java.util.Objects.toString(waResult.get("messageStatus"), null);
        String error = lastError;
        
        if (success) {
            boolean queued = messageStatus != null && messageStatus.equalsIgnoreCase("pending");
            // Update stats based on previous status
            if ("FAILED".equals(previousStatus)) {
                Integer currentSentCountObj = java.util.Objects.requireNonNullElse(report.getWaSentCount(), 0);
                Integer currentFailedCountObj = java.util.Objects.requireNonNullElse(report.getWaFailedCount(), 0);
                int currentSentCount = currentSentCountObj.intValue();
                int currentFailedCount = currentFailedCountObj.intValue();
                report.setWaFailedCount(Math.max(0, currentFailedCount - 1));
                if (!queued) {
                    report.setWaSentCount(currentSentCount + 1);
                }
            } else if ("PENDING".equals(previousStatus)) {
                if (!queued) {
                    Integer currentSentCountObj = java.util.Objects.requireNonNullElse(report.getWaSentCount(), 0);
                    report.setWaSentCount(currentSentCountObj.intValue() + 1);
                }
            }
            
            item.setWaStatus(queued ? "QUEUED" : "SENT");
            item.setWaMessageId(messageId);
            item.setWaSentAt(LocalDateTime.now());
            item.setWaErrorMessage(null);
            
            logger.info("[WA RESEND] SUCCESS - Item {} sent to {}, messageId: {}", itemId, item.getPhone(), messageId);
        } else {
            // Build detailed error message
            StringBuilder errorDetail = new StringBuilder();
            if (error != null) {
                errorDetail.append(error);
            }
            if (waResult.get("messageDetail") != null) {
                if (errorDetail.length() > 0) errorDetail.append(" | ");
                errorDetail.append("Detail: ").append(waResult.get("messageDetail"));
            }
            
            String finalError = errorDetail.length() > 0 ? errorDetail.toString() : "Unknown error after " + maxRetries + " attempts";
            
            // Update stats if was previously sent (unlikely but handle it)
            if ("SENT".equals(previousStatus)) {
                Integer currentSentCountObj = java.util.Objects.requireNonNullElse(report.getWaSentCount(), 0);
                Integer currentFailedCountObj = java.util.Objects.requireNonNullElse(report.getWaFailedCount(), 0);
                int currentSentCount = currentSentCountObj.intValue();
                int currentFailedCount = currentFailedCountObj.intValue();
                report.setWaSentCount(Math.max(0, currentSentCount - 1));
                report.setWaFailedCount(currentFailedCount + 1);
            } else if ("PENDING".equals(previousStatus)) {
                Integer currentFailedCountObj = java.util.Objects.requireNonNullElse(report.getWaFailedCount(), 0);
                report.setWaFailedCount(currentFailedCountObj.intValue() + 1);
            }
            
            item.setWaStatus("ERROR");
            item.setWaMessageId(messageId); // Still save if available
            item.setWaErrorMessage(finalError);
            
            logger.error("[WA RESEND] FAILED - Item {} to {}: {}", itemId, item.getPhone(), finalError);
        }
        
        videoReportItemRepository.save(item);
        videoReportRepository.save(report);
        
        if (!success) {
            throw new RuntimeException("Failed to send WhatsApp: " + item.getWaErrorMessage());
        }
        
        return item;
    }
    
    /**
     * Sync/update WA message status from Wablas API for pending items
     */
    @Transactional
    public Map<String, Object> syncWaStatus(Long reportId) {
        Map<String, Object> result = new java.util.HashMap<>();
        
        VideoReport report = videoReportRepository.findById(reportId).orElse(null);
        if (report == null) {
            result.put("success", false);
            result.put("error", "Report not found");
            return result;
        }
        
        // Get items with waStatus = SENT or PENDING that have messageId
        List<VideoReportItem> pendingItems = videoReportItemRepository.findByVideoReportIdOrderByRowNumberAsc(reportId).stream()
                .filter(item -> item.getWaMessageId() != null && !item.getWaMessageId().isEmpty())
            .filter(item -> "SENT".equals(item.getWaStatus()) || "PENDING".equals(item.getWaStatus()) || "QUEUED".equals(item.getWaStatus()))
                .collect(java.util.stream.Collectors.toList());
        
        logger.info("[WA SYNC] Checking {} items with messageId for report {}", pendingItems.size(), reportId);
        
        int updated = 0;
        int failed = 0;
        int delivered = 0;
        int read = 0;
        java.util.List<Map<String, Object>> statusUpdates = new java.util.ArrayList<>();
        
        for (VideoReportItem item : pendingItems) {
            try {
                Map<String, Object> waResult = whatsAppService.getMessageStatus(item.getWaMessageId());
                
                Map<String, Object> itemUpdate = new java.util.HashMap<>();
                itemUpdate.put("itemId", item.getId());
                itemUpdate.put("phone", item.getPhone());
                itemUpdate.put("oldStatus", item.getWaStatus());
                itemUpdate.put("messageId", item.getWaMessageId());
                
                if (Boolean.TRUE.equals(waResult.get("success"))) {
                    String wablasStatus = (String) waResult.get("status");
                    itemUpdate.put("wablasStatus", wablasStatus);
                    itemUpdate.put("rawResponse", waResult.get("rawResponse"));
                    
                    // Update status based on Wablas response
                    // Wablas statuses: pending, sent, delivered, read, cancel, rejected, failed
                    String oldWaStatus = item.getWaStatus();
                    int currentSentCount = java.util.Objects.requireNonNullElse(report.getWaSentCount(), 0);
                    int currentFailedCount = java.util.Objects.requireNonNullElse(report.getWaFailedCount(), 0);

                    if ("delivered".equalsIgnoreCase(wablasStatus) || "read".equalsIgnoreCase(wablasStatus)) {
                        if (!"DELIVERED".equals(oldWaStatus)) {
                            item.setWaStatus("DELIVERED");
                            item.setWaErrorMessage(null);
                            if (!"SENT".equals(oldWaStatus)) {
                                report.setWaSentCount(currentSentCount + 1);
                            }
                            updated++;
                        }
                        if ("delivered".equalsIgnoreCase(wablasStatus)) {
                            delivered++;
                        } else {
                            read++;
                        }
                        logger.info("[WA SYNC] Item {} delivered/read: {}", item.getId(), wablasStatus);
                    } else if ("sent".equalsIgnoreCase(wablasStatus)) {
                        if (!"SENT".equals(oldWaStatus) && !"DELIVERED".equals(oldWaStatus)) {
                            item.setWaStatus("SENT");
                            item.setWaErrorMessage(null);
                            report.setWaSentCount(currentSentCount + 1);
                            updated++;
                        }
                        logger.info("[WA SYNC] Item {} sent", item.getId());
                    } else if ("cancel".equalsIgnoreCase(wablasStatus) || "rejected".equalsIgnoreCase(wablasStatus) || "failed".equalsIgnoreCase(wablasStatus)) {
                        if (!"FAILED".equals(oldWaStatus) && !"ERROR".equals(oldWaStatus)) {
                            item.setWaStatus("ERROR");
                            item.setWaErrorMessage("Wablas status: " + wablasStatus);

                            if ("SENT".equals(oldWaStatus) || "DELIVERED".equals(oldWaStatus)) {
                                report.setWaSentCount(Math.max(0, currentSentCount - 1));
                            }
                            report.setWaFailedCount(currentFailedCount + 1);
                            updated++;
                        }
                        failed++;
                        logger.warn("[WA SYNC] Item {} failed: {}", item.getId(), wablasStatus);
                    } else if ("pending".equalsIgnoreCase(wablasStatus)) {
                        if (!"DELIVERED".equals(oldWaStatus) && !"QUEUED".equals(oldWaStatus) && !"PENDING".equals(oldWaStatus)) {
                            // Correct legacy statuses (e.g. SENT) back to QUEUED when Wablas still reports pending
                            if ("SENT".equals(oldWaStatus)) {
                                report.setWaSentCount(Math.max(0, currentSentCount - 1));
                            }
                            item.setWaStatus("QUEUED");
                            updated++;
                        } else if ("PENDING".equals(oldWaStatus)) {
                            item.setWaStatus("QUEUED");
                            updated++;
                        }
                        logger.info("[WA SYNC] Item {} still pending in Wablas", item.getId());
                    }
                    
                    itemUpdate.put("newStatus", item.getWaStatus());
                    videoReportItemRepository.save(item);
                } else {
                    itemUpdate.put("error", waResult.get("error"));
                    String oldWaStatus = item.getWaStatus();
                    int currentSentCount = java.util.Objects.requireNonNullElse(report.getWaSentCount(), 0);
                    int currentFailedCount = java.util.Objects.requireNonNullElse(report.getWaFailedCount(), 0);

                    String err = waResult.get("error") == null ? null : String.valueOf(waResult.get("error"));
                    String errorMessage = (err == null || err.isBlank()) ? "WA status check failed" : ("WA status check failed: " + err);

                    if (!"FAILED".equals(oldWaStatus) && !"ERROR".equals(oldWaStatus)) {
                        if ("SENT".equals(oldWaStatus) || "DELIVERED".equals(oldWaStatus)) {
                            report.setWaSentCount(Math.max(0, currentSentCount - 1));
                        }
                        report.setWaFailedCount(currentFailedCount + 1);
                        updated++;
                    }

                    item.setWaStatus("ERROR");
                    item.setWaErrorMessage(errorMessage);
                    itemUpdate.put("newStatus", item.getWaStatus());
                    videoReportItemRepository.save(item);
                    failed++;
                    logger.warn("[WA SYNC] Failed to get status for item {}: {}", item.getId(), waResult.get("error"));
                }
                
                statusUpdates.add(itemUpdate);
                
                // Add small delay to avoid rate limiting
                Thread.sleep(200);
                
            } catch (Exception e) {
                logger.error("[WA SYNC] Error checking item {}: {}", item.getId(), e.getMessage());
            }
        }
        
        videoReportRepository.save(report);
        
        result.put("success", true);
        result.put("totalChecked", pendingItems.size());
        result.put("updated", updated);
        result.put("delivered", delivered);
        result.put("read", read);
        result.put("failed", failed);
        result.put("statusUpdates", statusUpdates);
        
        logger.info("[WA SYNC] Completed for report {}: {} checked, {} updated ({} delivered, {} read, {} failed)", 
                reportId, pendingItems.size(), updated, delivered, read, failed);
        
        return result;
    }
    
    /**
     * Update WA message template for a report
     */
    @Transactional
    public VideoReport updateWaTemplate(Long reportId, String waTemplate) {
        VideoReport report = videoReportRepository.findById(reportId).orElse(null);
        if (report == null) {
            throw new RuntimeException("Report not found");
        }
        
        report.setWaMessageTemplate(waTemplate);
        return videoReportRepository.save(report);
    }

    /**
     * Check status of all pending clips and update
     * Uses parallel processing for efficiency with large batches
     */
    @Transactional
    public void checkPendingClips(Long reportId) {
        List<VideoReportItem> processingItems = videoReportItemRepository
                .findByVideoReportIdAndStatus(reportId, "PROCESSING");

        logger.info("[CHECK CLIPS] Checking {} PROCESSING items for report {}", processingItems.size(), reportId);
        
        if (processingItems.isEmpty()) {
            logger.info("[CHECK CLIPS] No processing items to check");
            return;
        }
        
        // Use parallel checking for large batches
        if (processingItems.size() > 10) {
            checkClipsParallel(processingItems, reportId);
        } else {
            checkClipsSequential(processingItems, reportId);
        }

        checkAndUpdateReportStatus(reportId);
    }
    
    /**
     * Check clips sequentially (for small batches)
     */
    private void checkClipsSequential(List<VideoReportItem> items, Long reportId) {
        for (VideoReportItem item : items) {
            checkSingleClipStatus(reportId, item);
        }
    }
    
    /**
     * Check clips in parallel (for large batches)
     */
    private void checkClipsParallel(List<VideoReportItem> items, Long reportId) {
        ExecutorService executor = Executors.newFixedThreadPool(videoGenerationParallelism);
        
        try {
            List<CompletableFuture<Void>> futures = items.stream()
                    .map(item -> CompletableFuture.runAsync(() -> checkSingleClipStatus(reportId, item), executor))
                    .collect(Collectors.toList());
            
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        } finally {
            executor.shutdown();
            try {
                executor.awaitTermination(60, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                executor.shutdownNow();
            }
        }
    }
    
    /**
     * Check status of a single clip
     */
    private void checkSingleClipStatus(Long reportId, VideoReportItem item) {
        if (item.getDidClipId() == null) return;
        
        try {
            logger.debug("[CHECK CLIPS] Checking D-ID status for clip: {}", item.getDidClipId());
            Map<String, Object> status = didService.getClipStatus(item.getDidClipId());
            
            if ((Boolean) status.get("success")) {
                String clipStatus = (String) status.get("status");
                
                if ("done".equals(clipStatus)) {
                    String resultUrl = (String) status.get("result_url");
                    if (resultUrl == null || resultUrl.isBlank()) {
                        item.setStatus("FAILED");
                        item.setErrorMessage("D-ID done but result_url is empty");
                        logger.warn("[CHECK CLIPS] Item {} FAILED: {}", item.getId(), item.getErrorMessage());
                    } else if (reportId == null) {
                        item.setStatus("FAILED");
                        item.setErrorMessage("Missing reportId; cannot save video to local");
                        logger.warn("[CHECK CLIPS] Item {} FAILED: {}", item.getId(), item.getErrorMessage());
                    } else {
                        try {
                            item.setVideoUrl(resultUrl);

                            Path tempPath = getTempVideoPath(reportId, item.getId());
                            Path sharePath = getShareVideoPath(reportId, item.getId());
                            ensureTempVideoExists(item, tempPath, sharePath);
                            item.setStatus("DONE");
                            item.setVideoGeneratedAt(LocalDateTime.now());
                            item.setErrorMessage(null);
                            logger.info("[CHECK CLIPS] Item {} DONE (saved local)", item.getId());
                        } catch (Exception ex) {
                            item.setStatus("FAILED");
                            item.setErrorMessage("Failed to download video to local: " + ex.getMessage());
                            logger.warn("[CHECK CLIPS] Item {} FAILED: {}", item.getId(), item.getErrorMessage());
                        }
                    }
                } else if ("error".equals(clipStatus)) {
                    item.setStatus("FAILED");
                    item.setErrorMessage((String) status.get("error"));
                    logger.warn("[CHECK CLIPS] Item {} FAILED: {}", item.getId(), item.getErrorMessage());
                }
                // Keep as PROCESSING if still being processed
                
                videoReportItemRepository.save(item);
            }
        } catch (Exception e) {
            logger.error("[CHECK CLIPS] Error checking item {}: {}", item.getId(), e.getMessage());
        }
    }
    
    /**
     * Retry all failed video items in a report
     */
    @Async
    @Transactional
    public void retryFailedVideos(Long reportId) {
        List<VideoReportItem> failedItems = videoReportItemRepository
                .findByVideoReportIdAndStatus(reportId, "FAILED");
        
        logger.info("[RETRY] ========================================");
        logger.info("[RETRY] Retrying {} failed items for report {}", failedItems.size(), reportId);
        logger.info("[RETRY] ========================================");
        
        if (failedItems.isEmpty()) {
            logger.info("[RETRY] No failed items to retry");
            return;
        }
        
        // Reset status to PENDING for retry
        for (VideoReportItem item : failedItems) {
            item.setStatus("PENDING");
            item.setErrorMessage(null);
            item.setDidClipId(null);
            videoReportItemRepository.save(item);
        }
        
        // Update report status
        VideoReport report = videoReportRepository.findById(reportId).orElse(null);
        if (report != null) {
            report.setStatus("PROCESSING");
            videoReportRepository.save(report);
        }
        
        // Start video generation for reset items
        startVideoGeneration(reportId);
    }
    
    /**
     * Retry all failed WA messages - reset to PENDING so next startWaBlast will pick them up
     */
    @Transactional  
    public void retryFailedWaMessages(Long reportId) {
        List<VideoReportItem> failedItems = videoReportItemRepository.findByVideoReportIdOrderByRowNumberAsc(reportId).stream()
                .filter(item -> "DONE".equals(item.getStatus())) // Only items with completed videos
                .filter(item -> "FAILED".equals(item.getWaStatus()) || "ERROR".equals(item.getWaStatus()))
                .collect(Collectors.toList());
        
        logger.info("[WA RETRY VIDEO] Retrying {} failed WA items for report {}", failedItems.size(), reportId);
        
        if (failedItems.isEmpty()) {
            logger.info("[WA RETRY VIDEO] No failed WA items to retry");
            return;
        }
        
        VideoReport report = videoReportRepository.findById(reportId).orElse(null);
        if (report == null) {
            logger.error("[WA RETRY VIDEO] Report not found: {}", reportId);
            return;
        }
        
        // Reset WA status to PENDING for retry
        for (VideoReportItem item : failedItems) {
            item.setWaStatus("PENDING");
            item.setWaErrorMessage(null);
            item.setWaMessageId(null);
            videoReportItemRepository.save(item);
        }
        
        // Update report failed count (subtract items being retried)
        int currentFailedCount = java.util.Objects.requireNonNullElse(report.getWaFailedCount(), 0);
        report.setWaFailedCount(Math.max(0, currentFailedCount - failedItems.size()));
        videoReportRepository.save(report);
        
        logger.info("[WA RETRY VIDEO] Reset {} items to PENDING", failedItems.size());
        
        // Now send them immediately
        startWaBlast(reportId);
    }

    private void checkAndUpdateReportStatus(Long reportId) {
        VideoReport report = videoReportRepository.findById(reportId).orElse(null);
        if (report == null) {
            logger.warn("[STATUS CHECK] Report {} not found", reportId);
            return;
        }

        int doneCount = videoReportItemRepository.countByVideoReportIdAndStatus(reportId, "DONE");
        int failedCount = videoReportItemRepository.countByVideoReportIdAndStatus(reportId, "FAILED");
        int processingCount = videoReportItemRepository.countByVideoReportIdAndStatus(reportId, "PROCESSING");
        int pendingCount = videoReportItemRepository.countByVideoReportIdAndStatus(reportId, "PENDING");

        report.setSuccessCount(doneCount);
        report.setFailedCount(failedCount);
        report.setProcessedRecords(doneCount + failedCount);

        // Check if all non-excluded items are done or failed (no more processing/pending)
        boolean allItemsFinished = (processingCount == 0 && pendingCount == 0);
        boolean hasFinishedItems = (doneCount + failedCount) > 0;
        
        if (allItemsFinished && hasFinishedItems) {
            report.setStatus("COMPLETED");
            report.setCompletedAt(LocalDateTime.now());
            logger.info("[VIDEO STATUS] Report {} marked as COMPLETED. WA blast will be triggered automatically.", reportId);
        }
        
        videoReportRepository.save(report);
    }

    /**
     * Get video report by ID with items
     */
    @Transactional(readOnly = true)
    public VideoReportResponse getVideoReport(Long id) {
        VideoReport report = videoReportRepository.findById(id).orElse(null);
        if (report == null) return null;

        // Don't load items here for large datasets - use separate paginated endpoint
        return mapToResponseWithoutItems(report);
    }

    /**
     * Get video report by ID with paginated items
     */
    @Transactional(readOnly = true)
    public VideoReportResponse getVideoReportWithItems(Long id, Pageable pageable, String status, String waStatus, String search) {
        VideoReport report = videoReportRepository.findById(id).orElse(null);
        if (report == null) return null;

        Page<VideoReportItem> itemsPage;
        
        // Handle waStatus filter
        if (waStatus != null && !waStatus.isEmpty()) {
            String waStatusUpper = waStatus.toUpperCase();
            switch (waStatusUpper) {
                case "PENDING" -> {
                    java.util.List<String> waStatuses = java.util.Arrays.asList("PENDING", "PROCESSING", "QUEUED");
                    if (search != null && !search.isEmpty()) {
                        itemsPage = videoReportItemRepository.searchByReportIdAndWaStatusInOrNull(id, waStatuses, search, pageable);
                    } else {
                        itemsPage = videoReportItemRepository.findByReportIdAndWaStatusInOrNullOrderByRowNumberAsc(id, waStatuses, pageable);
                    }
                }
                case "SENT" -> {
                    java.util.List<String> waStatuses = java.util.Arrays.asList("SENT", "DELIVERED");
                    if (search != null && !search.isEmpty()) {
                        itemsPage = videoReportItemRepository.searchByReportIdAndWaStatusIn(id, waStatuses, search, pageable);
                    } else {
                        itemsPage = videoReportItemRepository.findByReportIdAndWaStatusInOrderByRowNumberAsc(id, waStatuses, pageable);
                    }
                }
                case "FAILED", "ERROR" -> {
                    java.util.List<String> waStatuses = java.util.Arrays.asList("FAILED", "ERROR");
                    if (search != null && !search.isEmpty()) {
                        itemsPage = videoReportItemRepository.searchByReportIdAndWaStatusIn(id, waStatuses, search, pageable);
                    } else {
                        itemsPage = videoReportItemRepository.findByReportIdAndWaStatusInOrderByRowNumberAsc(id, waStatuses, pageable);
                    }
                }
                default -> {
                    if (search != null && !search.isEmpty()) {
                        itemsPage = videoReportItemRepository.searchByReportIdAndWaStatus(id, waStatusUpper, search, pageable);
                    } else {
                        itemsPage = videoReportItemRepository.findByVideoReportIdAndWaStatusOrderByRowNumberAsc(id, waStatusUpper, pageable);
                    }
                }
            }
        } else if (search != null && !search.isEmpty()) {
            if (status != null && !status.isEmpty() && !status.equals("all")) {
                itemsPage = videoReportItemRepository.searchByReportIdAndStatus(id, status.toUpperCase(), search, pageable);
            } else {
                itemsPage = videoReportItemRepository.searchByReportId(id, search, pageable);
            }
        } else {
            if (status != null && !status.isEmpty() && !status.equals("all")) {
                itemsPage = videoReportItemRepository.findByVideoReportIdAndStatusOrderByRowNumberAsc(id, status.toUpperCase(), pageable);
            } else {
                itemsPage = videoReportItemRepository.findByVideoReportIdOrderByRowNumberAsc(id, pageable);
            }
        }

        return mapToResponseWithPagedItems(report, itemsPage);
    }

    /**
     * Get all video reports paginated
     */
    @Transactional(readOnly = true)
    public Page<VideoReportResponse> getAllVideoReports(Pageable pageable) {
        return videoReportRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapToResponseWithoutItems);
    }

    /**
     * Delete video report
     */
    @Transactional
    public void deleteVideoReport(Long id) {
        videoReportItemRepository.deleteAll(
                videoReportItemRepository.findByVideoReportIdOrderByRowNumberAsc(id)
        );
        videoReportRepository.deleteById(id);
    }

    /**
     * Get single video item by report ID and item ID
     */
    @Transactional(readOnly = true)
    public VideoReportResponse.VideoReportItemResponse getVideoItemById(Long reportId, Long itemId) {
        VideoReportItem item = videoReportItemRepository.findByIdAndVideoReportId(itemId, reportId);
        if (item == null) {
            return null;
        }
        
        return mapItemToResponse(item);
    }
    
    private VideoReportItemResponse mapItemToResponse(VideoReportItem item) {
        VideoReportItemResponse ir = new VideoReportItemResponse();
        ir.setId(item.getId());
        ir.setRowNumber(item.getRowNumber());
        ir.setName(item.getName());
        ir.setPhone(item.getPhone());
        ir.setAvatar(item.getAvatar());
        ir.setPersonalizedMessage(item.getPersonalizedMessage());
        ir.setDidClipId(item.getDidClipId());
        ir.setStatus(item.getStatus());
        ir.setVideoUrl(item.getVideoUrl());
        ir.setVideoGeneratedAt(item.getVideoGeneratedAt());
        ir.setErrorMessage(item.getErrorMessage());
        ir.setWaStatus(item.getWaStatus());
        ir.setWaMessageId(item.getWaMessageId());
        ir.setWaErrorMessage(item.getWaErrorMessage());
        ir.setWaSentAt(item.getWaSentAt());
        ir.setExcluded(item.getExcluded());
        return ir;
    }

    private VideoReportResponse mapToResponse(VideoReport report, List<VideoReportItem> items) {
        VideoReportResponse response = new VideoReportResponse();
        response.setId(report.getId());
        response.setReportName(report.getReportName());
        response.setMessageTemplate(report.getMessageTemplate());
        response.setWaMessageTemplate(report.getWaMessageTemplate());
        response.setStatus(report.getStatus());
        response.setTotalRecords(report.getTotalRecords());
        response.setProcessedRecords(report.getProcessedRecords());
        response.setSuccessCount(report.getSuccessCount());
        response.setFailedCount(report.getFailedCount());
        response.setWaSentCount(report.getWaSentCount());
        response.setWaFailedCount(report.getWaFailedCount());
        response.setCreatedAt(report.getCreatedAt());
        response.setCompletedAt(report.getCompletedAt());

        List<VideoReportItemResponse> itemResponses = items.stream()
                .map(this::mapItemToResponse)
                .collect(Collectors.toList());

        response.setItems(itemResponses);
        return response;
    }

    private VideoReportResponse mapToResponseWithoutItems(VideoReport report) {
        VideoReportResponse response = new VideoReportResponse();
        response.setId(report.getId());
        response.setReportName(report.getReportName());
        response.setMessageTemplate(report.getMessageTemplate());
        response.setWaMessageTemplate(report.getWaMessageTemplate());
        response.setStatus(report.getStatus());
        response.setTotalRecords(report.getTotalRecords());
        response.setProcessedRecords(report.getProcessedRecords());
        response.setSuccessCount(report.getSuccessCount());
        response.setFailedCount(report.getFailedCount());
        // Get accurate counts from database (not from paginated items)
        int pendingCount = videoReportItemRepository.countByVideoReportIdAndStatus(report.getId(), "PENDING");
        int processingCount = videoReportItemRepository.countByVideoReportIdAndStatus(report.getId(), "PROCESSING");
        response.setPendingCount(pendingCount);
        response.setProcessingCount(processingCount);
        response.setWaSentCount(report.getWaSentCount());
        response.setWaFailedCount(report.getWaFailedCount());
        // Calculate WA pending count
        int waPendingCount = 0;
        waPendingCount += videoReportItemRepository.countByVideoReportIdAndWaStatus(report.getId(), "PENDING");
        waPendingCount += videoReportItemRepository.countByVideoReportIdAndWaStatus(report.getId(), "PROCESSING");
        waPendingCount += videoReportItemRepository.countByVideoReportIdAndWaStatus(report.getId(), "QUEUED");
        response.setWaPendingCount(waPendingCount);
        response.setCreatedAt(report.getCreatedAt());
        response.setCompletedAt(report.getCompletedAt());
        response.setItems(new ArrayList<>());
        return response;
    }

    private VideoReportResponse mapToResponseWithPagedItems(VideoReport report, Page<VideoReportItem> itemsPage) {
        VideoReportResponse response = new VideoReportResponse();
        response.setId(report.getId());
        response.setReportName(report.getReportName());
        response.setMessageTemplate(report.getMessageTemplate());
        response.setWaMessageTemplate(report.getWaMessageTemplate());
        response.setStatus(report.getStatus());
        response.setTotalRecords(report.getTotalRecords());
        response.setProcessedRecords(report.getProcessedRecords());
        response.setSuccessCount(report.getSuccessCount());
        response.setFailedCount(report.getFailedCount());
        // Get accurate counts from database (not from paginated items)
        int pendingCount = videoReportItemRepository.countByVideoReportIdAndStatus(report.getId(), "PENDING");
        int processingCount = videoReportItemRepository.countByVideoReportIdAndStatus(report.getId(), "PROCESSING");
        response.setPendingCount(pendingCount);
        response.setProcessingCount(processingCount);
        response.setWaSentCount(report.getWaSentCount());
        response.setWaFailedCount(report.getWaFailedCount());
        // Calculate WA pending count
        int waPendingCount = 0;
        waPendingCount += videoReportItemRepository.countByVideoReportIdAndWaStatus(report.getId(), "PENDING");
        waPendingCount += videoReportItemRepository.countByVideoReportIdAndWaStatus(report.getId(), "PROCESSING");
        waPendingCount += videoReportItemRepository.countByVideoReportIdAndWaStatus(report.getId(), "QUEUED");
        response.setWaPendingCount(waPendingCount);
        response.setCreatedAt(report.getCreatedAt());
        response.setCompletedAt(report.getCompletedAt());
        
        // Pagination info
        response.setItemsPage(itemsPage.getNumber());
        response.setItemsTotalPages(itemsPage.getTotalPages());
        response.setItemsTotalElements(itemsPage.getTotalElements());

        List<VideoReportItemResponse> itemResponses = itemsPage.getContent().stream()
                .map(this::mapItemToResponse)
                .collect(Collectors.toList());

        response.setItems(itemResponses);
        return response;
    }
}
