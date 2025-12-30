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
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.UUID;
import java.util.stream.Collectors;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

@Service
public class VideoReportService {
    private static final Logger logger = LoggerFactory.getLogger(VideoReportService.class);

    private final VideoReportRepository videoReportRepository;
    private final VideoReportItemRepository videoReportItemRepository;
    private final DIDService didService;
    private final ExcelService excelService;
    private final WhatsAppService whatsAppService;
    private final VideoBackgroundCompositeService videoBackgroundCompositeService;
    
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

    @Value("${app.wa.retry.delay-ms}")
    private long waRetryDelayMs;

    @Value("${app.video.share-dir:${app.video.base-dir}/share}")
    private String videoShareDir;

    @Value("${app.video.download.max-bytes:157286400}")
    private long videoDownloadMaxBytes;

    @Value("${app.video.download.connect-timeout-seconds:30}")
    private int videoDownloadConnectTimeoutSeconds;

    @Value("${app.video.download.read-timeout-seconds:300}")
    private int videoDownloadReadTimeoutSeconds;

    @Value("${app.video.cache.parallelism:2}")
    private int videoCacheParallelism;

    @Value("${app.video.cache.queue-capacity:200}")
    private int videoCacheQueueCapacity;

    @Value("${app.video.cache.lock-ttl-minutes:120}")
    private int videoCacheLockTtlMinutes;

    @Value("${app.wa.status-sync.max-items:200}")
    private int waStatusSyncMaxItems;

    private volatile ExecutorService videoCacheExecutor;
    private volatile HttpClient videoCacheHttpClient;
    private final java.util.concurrent.ConcurrentHashMap<String, Boolean> videoCacheInFlight = new java.util.concurrent.ConcurrentHashMap<>();

    private Path cacheLockPath(String token) {
        try {
            return Paths.get(videoShareDir, token + ".mp4.lock");
        } catch (Exception e) {
            return null;
        }
    }

    private boolean tryAcquireCacheLock(Path lockPath) {
        if (lockPath == null) {
            return false;
        }

        try {
            Files.createDirectories(lockPath.getParent());
        } catch (Exception ignore) {
        }

        try {
            if (Files.exists(lockPath)) {
                if (videoCacheLockTtlMinutes > 0) {
                    try {
                        java.nio.file.attribute.FileTime ft = Files.getLastModifiedTime(lockPath);
                        long cutoffMs = System.currentTimeMillis() - (videoCacheLockTtlMinutes * 60L * 1000L);
                        if (ft != null && ft.toMillis() < cutoffMs) {
                            Files.deleteIfExists(lockPath);
                        }
                    } catch (Exception ignore) {
                    }
                }
            }

            Files.createFile(lockPath);
            try {
                Files.setLastModifiedTime(lockPath, java.nio.file.attribute.FileTime.fromMillis(System.currentTimeMillis()));
            } catch (Exception ignore) {
            }
            return true;
        } catch (java.nio.file.FileAlreadyExistsException ignore) {
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    private void releaseCacheLock(Path lockPath) {
        if (lockPath == null) {
            return;
        }
        try {
            Files.deleteIfExists(lockPath);
        } catch (Exception ignore) {
        }
    }

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
        if (waRetryDelayMs <= 0) {
            throw new IllegalStateException("Invalid property app.wa.retry.delay-ms; must be > 0");
        }

        if (videoCacheParallelism <= 0) {
            throw new IllegalStateException("Invalid property app.video.cache.parallelism; must be > 0");
        }
        if (videoCacheQueueCapacity <= 0) {
            throw new IllegalStateException("Invalid property app.video.cache.queue-capacity; must be > 0");
        }
        if (videoDownloadConnectTimeoutSeconds <= 0) {
            throw new IllegalStateException("Invalid property app.video.download.connect-timeout-seconds; must be > 0");
        }
        if (videoDownloadReadTimeoutSeconds <= 0) {
            throw new IllegalStateException("Invalid property app.video.download.read-timeout-seconds; must be > 0");
        }
        if (videoDownloadMaxBytes <= 0) {
            throw new IllegalStateException("Invalid property app.video.download.max-bytes; must be > 0");
        }

        if (videoShareDir != null && !videoShareDir.isBlank()) {
            try {
                Files.createDirectories(Paths.get(videoShareDir));
            } catch (Exception e) {
                throw new IllegalStateException("Failed to create video share dir: " + videoShareDir, e);
            }
        }

        this.videoCacheExecutor = new ThreadPoolExecutor(
            videoCacheParallelism,
            videoCacheParallelism,
            0L,
            TimeUnit.MILLISECONDS,
            new ArrayBlockingQueue<>(videoCacheQueueCapacity),
            new ThreadPoolExecutor.AbortPolicy()
        );
        this.videoCacheHttpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(videoDownloadConnectTimeoutSeconds))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    @PreDestroy
    void shutdownVideoCacheExecutor() {
        ExecutorService ex = this.videoCacheExecutor;
        if (ex != null) {
            ex.shutdown();
        }
    }

    public VideoReportService(VideoReportRepository videoReportRepository,
                             VideoReportItemRepository videoReportItemRepository,
                             DIDService didService,
                             ExcelService excelService,
                             WhatsAppService whatsAppService,
                             VideoBackgroundCompositeService videoBackgroundCompositeService) {
        this.videoReportRepository = videoReportRepository;
        this.videoReportItemRepository = videoReportItemRepository;
        this.didService = didService;
        this.excelService = excelService;
        this.whatsAppService = whatsAppService;
        this.videoBackgroundCompositeService = videoBackgroundCompositeService;
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
        report.setUseBackground(Boolean.TRUE.equals(request.getUseBackground()));
        report.setBackgroundName(request.getBackgroundName());
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

        final String backgroundUrl = buildPublicBackgroundUrl(
                Boolean.TRUE.equals(report.getUseBackground()) ? report.getBackgroundName() : null
        );

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
                    .map(item -> CompletableFuture.supplyAsync(() -> processVideoItem(item, backgroundUrl), executor))
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
    private VideoReportItem processVideoItem(VideoReportItem item, String backgroundUrl) {
        try {
            String presenterId = didService.resolveExpressPresenterId(item.getAvatar());
            if (presenterId == null || presenterId.isBlank()) {
                item.setStatus("FAILED");
                item.setErrorMessage("Avatar tidak ditemukan (Express Avatar): " + item.getAvatar());
                videoReportItemRepository.save(item);
                return item;
            }

            didService.ensureClonedVoiceIdFromLocalSample(presenterId, item.getAvatar());
            
            // Create clip via D-ID
            Map<String, Object> result = didService.createClip(
                    presenterId,
                    item.getPersonalizedMessage(),
                    backgroundUrl,
                    null
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

        final String backgroundUrl = buildPublicBackgroundUrl(
            Boolean.TRUE.equals(report.getUseBackground()) ? report.getBackgroundName() : null
        );
        
        try {
            // Reset item status
            item.setStatus("PENDING");
            item.setVideoUrl(null);
            item.setErrorMessage(null);
            item.setDidClipId(null);
            videoReportItemRepository.save(item);
            
            // Convert avatar name to presenter ID
            String presenterId = didService.resolveExpressPresenterId(item.getAvatar());
            if (presenterId == null || presenterId.isBlank()) {
                item.setStatus("FAILED");
                item.setErrorMessage("Avatar tidak ditemukan (Express Avatar): " + item.getAvatar());
                videoReportItemRepository.save(item);
                checkAndUpdateReportStatus(reportId);
                return item;
            }

            didService.ensureClonedVoiceIdFromLocalSample(presenterId, item.getAvatar());
            
            // Create clip via D-ID
            Map<String, Object> result = didService.createClip(
                    presenterId,
                    item.getPersonalizedMessage(),
                    backgroundUrl,
                    null
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
            List<VideoReportItem> items = videoReportItemRepository.findByVideoReportIdOrderByRowNumberAsc(reportId)
                    .stream()
                    .filter(i -> "DONE".equals(i.getStatus()))
                    .filter(i -> !Boolean.TRUE.equals(i.getExcluded()))
                    .filter(i -> i.getWaStatus() == null || "PENDING".equals(i.getWaStatus()) || "PROCESSING".equals(i.getWaStatus()))
                    .collect(java.util.stream.Collectors.toList());
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
        
        String batchId = java.util.UUID.randomUUID().toString();
        LocalDateTime claimedAt = LocalDateTime.now();
        int claimed = 0;
        try {
            claimed = videoReportItemRepository.claimWaBlastBatch(reportId, batchId, claimedAt);
        } catch (Exception e) {
            logger.warn("[WA BLAST VIDEO] Failed claiming batch for report {}: {}", reportId, e.getMessage());
        }

        if (claimed <= 0) {
            logger.info("[WA BLAST VIDEO] No items ready for WA blast (PENDING)");
            return;
        }

        List<VideoReportItem> readyItems = videoReportItemRepository.findByVideoReportIdAndWaBatchIdOrderByRowNumberAsc(reportId, batchId);
        if (readyItems == null || readyItems.isEmpty()) {
            logger.info("[WA BLAST VIDEO] Claimed {} items but none loaded for batch {}", claimed, batchId);
            return;
        }

        logger.info("[WA BLAST VIDEO] Claimed {} items for batch {}", readyItems.size(), batchId);

        // STEP 3: Send LINK-only using Wablas v2 bulk API (100 per request)
        // Supports high volume (e.g., 1000) without video upload.
        java.util.List<WhatsAppService.BulkMessageItem> bulk = new java.util.ArrayList<>();
        java.util.Map<Long, VideoReportItem> byId = new java.util.HashMap<>();

        String waTemplate = report.getWaMessageTemplate();
        if (waTemplate == null || waTemplate.isEmpty()) {
            waTemplate = getDefaultWaMessageTemplate();
        }

        for (VideoReportItem item : readyItems) {
            String shareUrl = buildPublicVideoShareUrl(reportId, item.getId());
            String message = waTemplate
                    .replace(":name", item.getName() == null ? "" : item.getName())
                    .replace(":linkvideo", shareUrl == null ? "" : shareUrl);

            if (shareUrl != null && !shareUrl.isBlank() && !message.contains(shareUrl)) {
                message = message + "\n\n" + shareUrl;
            }

            bulk.add(new WhatsAppService.BulkMessageItem(item.getPhone(), message, String.valueOf(item.getId())));
            byId.put(item.getId(), item);
        }

        java.util.List<WhatsAppService.BulkMessageResult> results = whatsAppService.sendBulkMessagesWithRetry(bulk, 3);

        int successCount = 0;
        int failCount = 0;

        for (WhatsAppService.BulkMessageResult r : results) {
            Long itemId;
            try {
                itemId = r.getOriginalId() == null ? null : Long.parseLong(r.getOriginalId());
            } catch (Exception ignore) {
                itemId = null;
            }
            if (itemId == null) {
                continue;
            }

            VideoReportItem item = byId.get(itemId);
            if (item == null) {
                continue;
            }

            if (r.isSuccess()) {
                item.setWaStatus("QUEUED");
                item.setWaMessageId(r.getMessageId());
                item.setWaSentAt(LocalDateTime.now());
                item.setWaErrorMessage(null);
                successCount++;
            } else {
                item.setWaStatus("ERROR");
                item.setWaMessageId(r.getMessageId());
                item.setWaErrorMessage(r.getError());
                failCount++;
            }

            videoReportItemRepository.save(item);
        }

        // Any item still PROCESSING here means it never got a result back from provider
        int missingResultCount = 0;
        for (VideoReportItem item : readyItems) {
            if ("PROCESSING".equals(item.getWaStatus())) {
                item.setWaStatus("ERROR");
                item.setWaErrorMessage("No result returned from Wablas bulk send");
                videoReportItemRepository.save(item);
                missingResultCount++;
            }
        }

        if (missingResultCount > 0) {
            failCount += missingResultCount;
        }
        
        // Update report counters based on DB (avoid drift / double count)
        refreshWaCounts(report);
        
        logger.info("[WA BLAST VIDEO] ========================================");
        logger.info("[WA BLAST VIDEO] COMPLETED: {} sent, {} failed", successCount, failCount);
        logger.info("[WA BLAST VIDEO] ========================================");
    }

    private void refreshWaCounts(VideoReport report) {
        if (report == null || report.getId() == null) {
            return;
        }
        Long reportId = report.getId();
        int sent = 0;
        sent += videoReportItemRepository.countByVideoReportIdAndWaStatus(reportId, "SENT");
        sent += videoReportItemRepository.countByVideoReportIdAndWaStatus(reportId, "DELIVERED");

        int failed = 0;
        failed += videoReportItemRepository.countByVideoReportIdAndWaStatus(reportId, "FAILED");
        failed += videoReportItemRepository.countByVideoReportIdAndWaStatus(reportId, "ERROR");

        report.setWaSentCount(sent);
        report.setWaFailedCount(failed);
        videoReportRepository.save(report);
    }

    private LocalDateTime tryParseDateTime(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof LocalDateTime) {
            return (LocalDateTime) value;
        }
        if (!(value instanceof String)) {
            return null;
        }
        String s = ((String) value).trim();
        if (s.isEmpty()) {
            return null;
        }

        try {
            return LocalDateTime.parse(s, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        } catch (DateTimeParseException ignored) {
        }
        try {
            return LocalDateTime.parse(s, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS"));
        } catch (DateTimeParseException ignored) {
        }
        try {
            return LocalDateTime.parse(s, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        } catch (DateTimeParseException ignored) {
        }
        try {
            return LocalDateTime.parse(s, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (DateTimeParseException ignored) {
        }
        return null;
    }


    private String buildPublicVideoShareUrl(Long reportId, Long itemId) {
        String token = VideoLinkEncryptor.encryptVideoLinkShort(reportId, itemId);
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

        return base + ctx + "/v/" + token;
    }

    public String getPublicVideoShareUrl(Long reportId, Long itemId) {
        return buildPublicVideoShareUrl(reportId, itemId);
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

        String shareUrl = buildPublicVideoShareUrl(reportId, item.getId());

        String caption = waTemplate
            .replace(":name", item.getName() == null ? "" : item.getName())
            .replace(":linkvideo", shareUrl == null ? "" : shareUrl);

        if (shareUrl != null && !shareUrl.isBlank() && !caption.contains(shareUrl)) {
            caption = caption + "\n\n" + shareUrl;
        }
        
        String previousStatus = item.getWaStatus();
        Map<String, Object> waResult = new java.util.HashMap<>();
        boolean success = false;
        String lastError = null;
        
        // Retry loop
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            logger.info("[WA RESEND] Item {} - Attempt {}/{} to {}", itemId, attempt, maxRetries, item.getPhone());

            // Send WhatsApp TEXT message with share link
            Map<String, Object> attemptResult;
            try {
                attemptResult = whatsAppService.sendTextMessageWithDetails(
                        item.getPhone(),
                        caption
                );
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
            .filter(item -> "SENT".equals(item.getWaStatus()) || "PENDING".equals(item.getWaStatus()) || "QUEUED".equals(item.getWaStatus()) || "PROCESSING".equals(item.getWaStatus()))
                .collect(java.util.stream.Collectors.toList());

        if (waStatusSyncMaxItems > 0 && pendingItems.size() > waStatusSyncMaxItems) {
            pendingItems = pendingItems.subList(0, waStatusSyncMaxItems);
        }
        
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

                    LocalDateTime providerUpdatedAt = tryParseDateTime(waResult.get("updatedAt"));
                    LocalDateTime providerCreatedAt = tryParseDateTime(waResult.get("createdAt"));
                    LocalDateTime providerBestTime = providerUpdatedAt != null ? providerUpdatedAt : providerCreatedAt;
                    
                    // Update status based on Wablas response
                    // Wablas statuses: pending, sent, delivered, read, cancel, rejected, failed
                    String oldWaStatus = item.getWaStatus();

                    if ("delivered".equalsIgnoreCase(wablasStatus) || "read".equalsIgnoreCase(wablasStatus)) {
                        if (!"DELIVERED".equals(oldWaStatus)) {
                            item.setWaStatus("DELIVERED");
                            item.setWaErrorMessage(null);
                            updated++;
                        }
                        if ("delivered".equalsIgnoreCase(wablasStatus)) {
                            delivered++;
                        } else {
                            read++;
                        }
                        if (providerBestTime != null) {
                            item.setWaSentAt(providerBestTime);
                        }
                        logger.info("[WA SYNC] Item {} delivered/read: {}", item.getId(), wablasStatus);
                    } else if ("sent".equalsIgnoreCase(wablasStatus)) {
                        if (!"SENT".equals(oldWaStatus) && !"DELIVERED".equals(oldWaStatus)) {
                            item.setWaStatus("SENT");
                            item.setWaErrorMessage(null);
                            updated++;
                        }
                        if (providerBestTime != null) {
                            item.setWaSentAt(providerBestTime);
                        }
                        logger.info("[WA SYNC] Item {} sent", item.getId());
                    } else if ("cancel".equalsIgnoreCase(wablasStatus) || "rejected".equalsIgnoreCase(wablasStatus) || "failed".equalsIgnoreCase(wablasStatus)) {
                        if (!"FAILED".equals(oldWaStatus) && !"ERROR".equals(oldWaStatus)) {
                            item.setWaStatus("ERROR");
                            item.setWaErrorMessage("Wablas status: " + wablasStatus);
                            updated++;
                        }
                        failed++;
                        if (providerBestTime != null) {
                            item.setWaSentAt(providerBestTime);
                        }
                        logger.warn("[WA SYNC] Item {} failed: {}", item.getId(), wablasStatus);
                    } else if ("pending".equalsIgnoreCase(wablasStatus)) {
                        if (!"DELIVERED".equals(oldWaStatus) && !"QUEUED".equals(oldWaStatus) && !"PENDING".equals(oldWaStatus)) {
                            // Correct legacy statuses (e.g. SENT) back to QUEUED when Wablas still reports pending
                            item.setWaStatus("QUEUED");
                            updated++;
                        } else if ("PENDING".equals(oldWaStatus)) {
                            item.setWaStatus("QUEUED");
                            updated++;
                        }
                        if (providerCreatedAt != null) {
                            item.setWaSentAt(providerCreatedAt);
                        }
                        logger.info("[WA SYNC] Item {} still pending in Wablas", item.getId());
                    }
                    
                    itemUpdate.put("newStatus", item.getWaStatus());
                    videoReportItemRepository.save(item);
                } else {
                    itemUpdate.put("error", waResult.get("error"));
                    String err = waResult.get("error") == null ? null : String.valueOf(waResult.get("error"));
                    String errorMessage = (err == null || err.isBlank()) ? "WA status check failed" : ("WA status check failed: " + err);

                    // Do not change waStatus on status-check failure (provider instability)
                    itemUpdate.put("newStatus", item.getWaStatus());
                    itemUpdate.put("note", errorMessage);
                    logger.warn("[WA SYNC] Status check unavailable for item {}: {}", item.getId(), err);
                }
                
                statusUpdates.add(itemUpdate);
                
            } catch (Exception e) {
                logger.error("[WA SYNC] Error checking item {}: {}", item.getId(), e.getMessage());
            }
        }

        refreshWaCounts(report);
        
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
            logger.info("[CHECK CLIPS] Checking D-ID status for clip: {} (item: {})", item.getDidClipId(), item.getId());
            Map<String, Object> status = didService.getClipStatus(item.getDidClipId());
            
            logger.info("[CHECK CLIPS] D-ID response for item {}: success={}, status={}, error={}, result_url={}", 
                item.getId(), status.get("success"), status.get("status"), status.get("error"), status.get("result_url"));
            
            if (Boolean.TRUE.equals(status.get("success"))) {
                String clipStatus = (String) status.get("status");
                logger.info("[CHECK CLIPS] Item {} - Processing clipStatus: {}", item.getId(), clipStatus);
                
                if ("done".equals(clipStatus)) {
                    String resultUrl = (String) status.get("result_url");
                    logger.info("[CHECK CLIPS] Item {} - resultUrl: {}", item.getId(), resultUrl);
                    if (resultUrl == null || resultUrl.isBlank()) {
                        item.setStatus("FAILED");
                        item.setErrorMessage("D-ID done but result_url is empty");
                        logger.warn("[CHECK CLIPS] Item {} FAILED: {}", item.getId(), item.getErrorMessage());
                    } else {
                        // D-ID already applies background during video generation via API
                        // No need for local ffmpeg composite
                        item.setVideoUrl(resultUrl);
                        item.setStatus("DONE");
                        item.setVideoGeneratedAt(LocalDateTime.now());
                        item.setErrorMessage(null);
                        logger.info("[CHECK CLIPS] Item {} DONE with URL: {}", item.getId(), resultUrl);

                        enqueueShareCacheDownloadIfNeeded(reportId, item.getId(), resultUrl);
                    }
                } else if ("error".equals(clipStatus)) {
                    item.setStatus("FAILED");
                    item.setErrorMessage((String) status.get("error"));
                    logger.warn("[CHECK CLIPS] Item {} FAILED: {}", item.getId(), item.getErrorMessage());
                } else {
                    logger.info("[CHECK CLIPS] Item {} still PROCESSING with D-ID status: {}", item.getId(), clipStatus);
                }
                
                videoReportItemRepository.save(item);
            } else {
                logger.error("[CHECK CLIPS] D-ID API call failed for item {}: {}", item.getId(), status.get("error"));
            }
        } catch (Exception e) {
            logger.error("[CHECK CLIPS] Exception checking item {} (clip: {}): {}", item.getId(), item.getDidClipId(), e.getMessage(), e);
        }
    }

    public void enqueueShareCacheDownloadIfNeeded(Long reportId, Long itemId, String sourceUrl) {
        if (reportId == null || itemId == null) {
            return;
        }
        if (sourceUrl == null || sourceUrl.isBlank()) {
            return;
        }
        if (videoShareDir == null || videoShareDir.isBlank()) {
            return;
        }
        ExecutorService ex = this.videoCacheExecutor;
        HttpClient client = this.videoCacheHttpClient;
        if (ex == null || client == null) {
            return;
        }

        String token = VideoLinkEncryptor.encryptVideoLinkShort(reportId, itemId);
        if (token == null || token.isBlank()) {
            return;
        }

        if (videoCacheInFlight.putIfAbsent(token, Boolean.TRUE) != null) {
            return;
        }

        Path targetPath;
        try {
            targetPath = Paths.get(videoShareDir, token + ".mp4");
        } catch (Exception e) {
            videoCacheInFlight.remove(token);
            return;
        }

        try {
            if (Files.exists(targetPath) && Files.size(targetPath) > 0) {
                videoCacheInFlight.remove(token);
                return;
            }
        } catch (Exception ignore) {
        }

        Path lockPath = cacheLockPath(token);
        if (!tryAcquireCacheLock(lockPath)) {
            videoCacheInFlight.remove(token);
            return;
        }

        try {
            ex.submit(() -> {
            try {
                if (Files.exists(targetPath) && Files.size(targetPath) > 0) {
                    return;
                }
                Files.createDirectories(targetPath.getParent());

                Path tmpPath = Paths.get(videoShareDir, token + ".mp4.tmp." + UUID.randomUUID());

                URI sourceUri = URI.create(sourceUrl);
                HttpRequest req = HttpRequest.newBuilder(sourceUri)
                        .timeout(Duration.ofSeconds(videoDownloadReadTimeoutSeconds))
                        .GET()
                        .build();

                HttpResponse<InputStream> resp = client.send(req, HttpResponse.BodyHandlers.ofInputStream());
                int status = resp.statusCode();
                if (status != 200 && status != 206) {
                    InputStream body = resp.body();
                    if (body != null) {
                        body.close();
                    }
                    return;
                }

                long expectedLength = -1;
                try {
                    expectedLength = resp.headers().firstValueAsLong("content-length").orElse(-1);
                } catch (Exception ignore) {
                }
                if (expectedLength > 0 && expectedLength > videoDownloadMaxBytes) {
                    InputStream body = resp.body();
                    if (body != null) {
                        body.close();
                    }
                    return;
                }

                long copied = 0;
                try (InputStream in = resp.body(); java.io.OutputStream out = Files.newOutputStream(tmpPath)) {
                    byte[] buffer = new byte[8192];
                    int read;
                    while ((read = in.read(buffer)) >= 0) {
                        if (read == 0) {
                            continue;
                        }
                        copied += read;
                        if (copied > videoDownloadMaxBytes) {
                            throw new IllegalStateException("Video exceeds max bytes: " + copied);
                        }
                        out.write(buffer, 0, read);
                    }
                }

                if (copied <= 0) {
                    try {
                        Files.deleteIfExists(tmpPath);
                    } catch (Exception ignore) {
                    }
                    return;
                }

                Files.move(tmpPath, targetPath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
                logger.info("[VIDEO CACHE] Cached video token {} ({} bytes)", token, copied);
            } catch (Exception e) {
                // best-effort tmp cleanup is handled per tmpPath scope
                logger.warn("[VIDEO CACHE] Failed caching token {}: {}", VideoLinkEncryptor.encryptVideoLinkShort(reportId, itemId), e.getMessage());
            } finally {
                releaseCacheLock(lockPath);
                videoCacheInFlight.remove(token);
            }
        });
        } catch (RejectedExecutionException rex) {
            releaseCacheLock(lockPath);
            videoCacheInFlight.remove(token);
            logger.warn("[VIDEO CACHE] Queue full; skip token {}", token);
        } catch (Exception e) {
            releaseCacheLock(lockPath);
            videoCacheInFlight.remove(token);
        }
    }

    public boolean cacheVideoBlockingIfNeeded(Long reportId, Long itemId, String sourceUrl) {
        if (reportId == null || itemId == null) {
            return false;
        }
        if (sourceUrl == null || sourceUrl.isBlank()) {
            return false;
        }
        if (videoShareDir == null || videoShareDir.isBlank()) {
            return false;
        }

        String token = VideoLinkEncryptor.encryptVideoLinkShort(reportId, itemId);
        if (token == null || token.isBlank()) {
            return false;
        }

        Path targetPath;
        try {
            targetPath = Paths.get(videoShareDir, token + ".mp4");
        } catch (Exception e) {
            return false;
        }

        try {
            if (Files.exists(targetPath) && Files.size(targetPath) > 0) {
                return true;
            }
        } catch (Exception ignore) {
        }

        Path lockPath = cacheLockPath(token);
        if (!tryAcquireCacheLock(lockPath)) {
            return false;
        }

        try {
            if (Files.exists(targetPath) && Files.size(targetPath) > 0) {
                return true;
            }
        } catch (Exception ignore) {
        }

        HttpClient client = this.videoCacheHttpClient;
        if (client == null) {
            client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(videoDownloadConnectTimeoutSeconds))
                    .followRedirects(HttpClient.Redirect.NORMAL)
                    .build();
        }

        Path tmpPath = null;
        try {
            Files.createDirectories(targetPath.getParent());
            tmpPath = Paths.get(videoShareDir, token + ".mp4.tmp." + UUID.randomUUID());

            URI sourceUri = URI.create(sourceUrl);
            HttpRequest req = HttpRequest.newBuilder(sourceUri)
                    .timeout(Duration.ofSeconds(videoDownloadReadTimeoutSeconds))
                    .GET()
                    .build();

            HttpResponse<InputStream> resp = client.send(req, HttpResponse.BodyHandlers.ofInputStream());
            int status = resp.statusCode();
            if (status != 200 && status != 206) {
                InputStream body = resp.body();
                if (body != null) {
                    body.close();
                }
                return false;
            }

            long expectedLength = -1;
            try {
                expectedLength = resp.headers().firstValueAsLong("content-length").orElse(-1);
            } catch (Exception ignore) {
            }
            if (expectedLength > 0 && expectedLength > videoDownloadMaxBytes) {
                InputStream body = resp.body();
                if (body != null) {
                    body.close();
                }
                return false;
            }

            long copied = 0;
            try (InputStream in = resp.body(); java.io.OutputStream out = Files.newOutputStream(tmpPath)) {
                byte[] buffer = new byte[8192];
                int read;
                while ((read = in.read(buffer)) >= 0) {
                    if (read == 0) {
                        continue;
                    }
                    copied += read;
                    if (copied > videoDownloadMaxBytes) {
                        throw new IllegalStateException("Video exceeds max bytes: " + copied);
                    }
                    out.write(buffer, 0, read);
                }
            }

            if (copied <= 0) {
                return false;
            }

            Files.move(tmpPath, targetPath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            logger.info("[VIDEO CACHE] Cached video token {} ({} bytes) [blocking]", token, copied);
            return true;
        } catch (Exception e) {
            logger.warn("[VIDEO CACHE] Blocking cache failed token {}: {}", token, e.getMessage());
            return false;
        } finally {
            if (tmpPath != null) {
                try {
                    Files.deleteIfExists(tmpPath);
                } catch (Exception ignore) {
                }
            }
            releaseCacheLock(lockPath);
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
        String videoUrl = item.getVideoUrl();
        try {
            VideoReport report = item.getVideoReport();
            if (videoUrl != null
                    && !videoUrl.isBlank()
                    && "DONE".equals(item.getStatus())
                    && report != null) {
                String token = VideoLinkEncryptor.encryptVideoLinkShort(report.getId(), item.getId());
                if (token != null && !token.isBlank()) {
                    videoUrl = buildPublicStreamUrl(token);
                }
            }
        } catch (Exception ignored) {
        }
        ir.setVideoUrl(videoUrl);
        ir.setVideoGeneratedAt(item.getVideoGeneratedAt());
        ir.setErrorMessage(item.getErrorMessage());
        ir.setWaStatus(item.getWaStatus());
        ir.setWaMessageId(item.getWaMessageId());
        ir.setWaErrorMessage(item.getWaErrorMessage());
        ir.setWaSentAt(item.getWaSentAt());
        ir.setExcluded(item.getExcluded());
        return ir;
    }

    private String buildPublicStreamUrl(String token) {
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

    private VideoReportResponse mapToResponseWithoutItems(VideoReport report) {
        VideoReportResponse response = new VideoReportResponse();
        response.setId(report.getId());
        response.setReportName(report.getReportName());
        response.setMessageTemplate(report.getMessageTemplate());
        response.setWaMessageTemplate(report.getWaMessageTemplate());
        response.setUseBackground(Boolean.TRUE.equals(report.getUseBackground()));
        response.setBackgroundName(report.getBackgroundName());
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
        int waSentCount = 0;
        waSentCount += videoReportItemRepository.countByVideoReportIdAndWaStatus(report.getId(), "SENT");
        waSentCount += videoReportItemRepository.countByVideoReportIdAndWaStatus(report.getId(), "DELIVERED");
        response.setWaSentCount(waSentCount);
        int waFailedCount = 0;
        waFailedCount += videoReportItemRepository.countByVideoReportIdAndWaStatus(report.getId(), "FAILED");
        waFailedCount += videoReportItemRepository.countByVideoReportIdAndWaStatus(report.getId(), "ERROR");
        response.setWaFailedCount(waFailedCount);
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
        response.setUseBackground(Boolean.TRUE.equals(report.getUseBackground()));
        response.setBackgroundName(report.getBackgroundName());
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
        int waSentCount = 0;
        waSentCount += videoReportItemRepository.countByVideoReportIdAndWaStatus(report.getId(), "SENT");
        waSentCount += videoReportItemRepository.countByVideoReportIdAndWaStatus(report.getId(), "DELIVERED");
        response.setWaSentCount(waSentCount);
        int waFailedCount = 0;
        waFailedCount += videoReportItemRepository.countByVideoReportIdAndWaStatus(report.getId(), "FAILED");
        waFailedCount += videoReportItemRepository.countByVideoReportIdAndWaStatus(report.getId(), "ERROR");
        response.setWaFailedCount(waFailedCount);
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

    private String buildPublicBackgroundUrl(String backgroundName) {
        if (backgroundName == null || backgroundName.isBlank()) {
            return null;
        }

        try {
            org.springframework.core.io.Resource r = new org.springframework.core.io.ClassPathResource("background/" + backgroundName);
            if (!r.exists() || !r.isReadable()) {
                return null;
            }
        } catch (Exception ignore) {
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

        String encoded;
        try {
            encoded = java.net.URLEncoder.encode(backgroundName, java.nio.charset.StandardCharsets.UTF_8)
                    .replace("+", "%20");
        } catch (Exception e) {
            encoded = backgroundName;
        }

        return base + ctx + "/api/video-backgrounds/" + encoded;
    }
}
