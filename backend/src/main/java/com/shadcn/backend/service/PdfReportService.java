package com.shadcn.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.shadcn.backend.dto.PdfExcelValidationResult;
import com.shadcn.backend.dto.PdfReportRequest;
import com.shadcn.backend.dto.PdfReportResponse;
import com.shadcn.backend.dto.PdfReportResponse.PdfReportItemResponse;
import com.shadcn.backend.entity.PdfReport;
import com.shadcn.backend.entity.PdfReportItem;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.PdfReportItemRepository;
import com.shadcn.backend.repository.PdfReportRepository;
import com.shadcn.backend.util.PdfLinkEncryptor;

@Service
public class PdfReportService {
    private static final Logger logger = LoggerFactory.getLogger(PdfReportService.class);
    
    // PDF generation is fast, can use higher parallelism
    private static final int PDF_GENERATION_PARALLELISM = 20;
    private static final int PDF_GENERATION_BATCH_SIZE = 100;

    private final PdfReportRepository pdfReportRepository;
    private final PdfReportItemRepository pdfReportItemRepository;
    private final PdfGeneratorService pdfGeneratorService;
    private final PdfExcelService pdfExcelService;
    private final WhatsAppService whatsAppService;
    private final PdfReportService self;
    
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${whatsapp.wablas.bulk-enabled:true}")
    private boolean whatsappBulkEnabled;

    public PdfReportService(PdfReportRepository pdfReportRepository,
                           PdfReportItemRepository pdfReportItemRepository,
                           PdfGeneratorService pdfGeneratorService,
                           PdfExcelService pdfExcelService,
                           WhatsAppService whatsAppService,
                           @Lazy PdfReportService self) {
        this.pdfReportRepository = pdfReportRepository;
        this.pdfReportItemRepository = pdfReportItemRepository;
        this.pdfGeneratorService = pdfGeneratorService;
        this.pdfExcelService = pdfExcelService;
        this.whatsAppService = whatsAppService;
        this.self = self;
    }

    /**
     * Get default PDF message template
     */
    public String getDefaultMessageTemplate() {
        return """
            Perihal: Sambutan Hangat dan Selamat Bergabung dengan Keluarga Kami
            
            Yth. Sdr/i :name,
            
            Dengan penuh sukacita dan antusiasme, kami, seluruh jajaran manajemen dan staf Perusahaan Inovasi Global (PIG), mengucapkan selamat datang yang paling hangat atas bergabungnya Anda bersama kami.
            
            Keputusan Anda untuk bergabung adalah kabar baik bagi kami. Kami percaya, semangat dan talenta yang Anda miliki adalah kunci yang akan memperkuat inovasi dan kolaborasi tim kami. Kami siap mendukung perjalanan profesional Anda.
            
            Kami berdedikasi untuk menciptakan lingkungan yang dinamis, menantang, dan suportif. Kami tidak sabar melihat bagaimana energi baru dari Anda akan mendorong pencapaian proyek-proyek penting kami di masa depan.
            
            Sekali lagi, selamat datang, :name. Kami sangat menantikan hari-hari kerja yang produktif dan menyenangkan bersama Anda.
            """;
    }
    
    /**
     * Get default WA message template for PDF
     */
    public String getDefaultWaMessageTemplate() {
        return "Halo :name!\n\nKami punya surat spesial untuk Anda.\n\nKlik link berikut untuk melihat:\n:linkpdf\n\nTerima kasih!";
    }

    /**
     * Validate uploaded Excel file
     */
    public PdfExcelValidationResult validateExcel(MultipartFile file) {
        return pdfExcelService.parseAndValidateExcel(file);
    }

    /**
     * Get all items by report ID (for export)
     */
    public List<PdfReportItem> getAllItemsByReportId(Long reportId) {
        return pdfReportItemRepository.findByPdfReportIdOrderByRowNumberAsc(reportId);
    }

    /**
     * Create PDF report from request
     */
    @Transactional
    public PdfReport createPdfReport(PdfReportRequest request, User user) {
        PdfReport report = new PdfReport();
        report.setReportName(request.getReportName());
        report.setMessageTemplate(request.getMessageTemplate());
        report.setWaMessageTemplate(request.getWaMessageTemplate());
        report.setStatus("PENDING");
        report.setTotalRecords(request.getItems().size());
        report.setCreatedBy(user);
        
        report = pdfReportRepository.save(report);

        // Create items
        for (PdfReportRequest.PdfReportItemRequest itemRequest : request.getItems()) {
            PdfReportItem item = new PdfReportItem();
            item.setPdfReport(report);
            item.setRowNumber(itemRequest.getRowNumber());
            item.setName(itemRequest.getName());
            item.setPhone(itemRequest.getPhone());
            
            // Generate personalized message
            String personalizedMessage = request.getMessageTemplate()
                    .replace(":name", itemRequest.getName());
            item.setPersonalizedMessage(personalizedMessage);
            item.setStatus("PENDING");
            item.setWaStatus("PENDING");
            item.setExcluded(false);
            
            pdfReportItemRepository.save(item);
        }

        return report;
    }

    /**
     * Start PDF generation process with parallel processing
     */
    @Async
    @Transactional
    public void startPdfGeneration(Long reportId) {
        PdfReport report = pdfReportRepository.findById(reportId).orElse(null);
        if (report == null) {
            logger.error("PDF report not found: {}", reportId);
            return;
        }

        report.setStatus("PROCESSING");
        pdfReportRepository.save(report);

        List<PdfReportItem> items = pdfReportItemRepository
                .findByPdfReportIdOrderByRowNumberAsc(reportId);
        
        // Filter out excluded and already processed items
        List<PdfReportItem> pendingItems = items.stream()
                .filter(item -> !Boolean.TRUE.equals(item.getExcluded()))
                .filter(item -> "PENDING".equals(item.getStatus()) || "FAILED".equals(item.getStatus()))
                .collect(Collectors.toList());
        
        logger.info("[PDF GEN] ========================================");
        logger.info("[PDF GEN] Starting PDF generation for report {}", reportId);
        logger.info("[PDF GEN] Total items: {}, Pending items: {}", items.size(), pendingItems.size());
        logger.info("[PDF GEN] ========================================");
        
        if (pendingItems.isEmpty()) {
            logger.info("[PDF GEN] No pending items to process");
            checkAndUpdateReportStatus(reportId);
            return;
        }
        
        // Build recipient list for table display (TESTING FEATURE)
        final List<PdfGeneratorService.RecipientData> allRecipients = items.stream()
                .map(item -> new PdfGeneratorService.RecipientData(
                        item.getRowNumber(),
                        item.getName(),
                        item.getPhone()
                ))
                .collect(Collectors.toList());
        
        // Create thread pool for parallel processing
        ExecutorService executor = Executors.newFixedThreadPool(PDF_GENERATION_PARALLELISM);
        
        try {
            // Process in batches
            List<List<PdfReportItem>> batches = splitIntoBatches(pendingItems, PDF_GENERATION_BATCH_SIZE);
            int batchNumber = 0;
            
            for (List<PdfReportItem> batch : batches) {
                batchNumber++;
                logger.info("[PDF GEN] Processing batch {}/{} ({} items)", batchNumber, batches.size(), batch.size());
                
                // Submit all items in batch for parallel processing
                List<CompletableFuture<PdfReportItem>> futures = batch.stream()
                        .map(item -> CompletableFuture.supplyAsync(() -> processPdfItem(item, report, allRecipients), executor))
                        .collect(Collectors.toList());
                
                // Wait for all items in batch to complete
                CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
                
                // Update report progress
                PdfReport currentReport = pdfReportRepository.findById(reportId).orElse(null);
                if (currentReport != null) {
                    int processed = (int) items.stream()
                            .filter(i -> !"PENDING".equals(i.getStatus()))
                            .count();
                    int failed = (int) items.stream()
                            .filter(i -> "FAILED".equals(i.getStatus()))
                            .count();
                    
                    currentReport.setProcessedRecords(processed);
                    currentReport.setFailedCount(failed);
                    pdfReportRepository.save(currentReport);
                    
                    logger.info("[PDF GEN] Batch {}/{} complete - Processed: {}, Failed: {}", 
                            batchNumber, batches.size(), processed, failed);
                }
            }
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
        
        // Get final counts for summary
        PdfReport finalReport = pdfReportRepository.findById(reportId).orElse(null);
        int finalSuccess = finalReport != null ? finalReport.getSuccessCount() : 0;
        int finalFailed = finalReport != null ? finalReport.getFailedCount() : 0;
        
        logger.info("[PDF GEN] ========================================");
        logger.info("[PDF GEN] COMPLETED - Report ID: {}", reportId);
        logger.info("[PDF GEN] Total Items: {}", pendingItems.size());
        logger.info("[PDF GEN] Success: {} | Failed: {}", finalSuccess, finalFailed);
        logger.info("[PDF GEN] Status: {}", finalReport != null ? finalReport.getStatus() : "UNKNOWN");
        logger.info("[PDF GEN] WA blast will be sent by scheduler automatically");
        logger.info("[PDF GEN] ========================================");
    }
    
    /**
     * Process a single PDF item
     */
    private PdfReportItem processPdfItem(PdfReportItem item, PdfReport report, List<PdfGeneratorService.RecipientData> allRecipients) {
        try {
            item.setStatus("PROCESSING");
            pdfReportItemRepository.save(item);
            
            // Generate PDF with recipient list table (for testing)
            String pdfUrl = pdfGeneratorService.generatePdf(
                    report.getId(),
                    item.getId(),
                    item.getName(),
                    item.getPersonalizedMessage(),
                    allRecipients // Pass all recipients for table display
            );
            
            // Extract filename from URL
            String filename = pdfUrl.substring(pdfUrl.lastIndexOf("/") + 1);
            
            item.setPdfUrl(pdfUrl);
            item.setPdfFilename(filename);
            item.setStatus("DONE");
            item.setPdfGeneratedAt(LocalDateTime.now());
            
            logger.info("[PDF GEN] Item {} - PDF generated: {}", item.getId(), filename);
            
        } catch (Exception e) {
            logger.error("[PDF GEN] Item {} - Exception: {}", item.getId(), e.getMessage());
            item.setStatus("FAILED");
            item.setErrorMessage(e.getMessage());
        }

        pdfReportItemRepository.save(item);
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
     * Generate PDF for a single item
     */
    @Transactional
    public PdfReportItem generateSinglePdf(Long reportId, Long itemId) {
        PdfReportItem item = pdfReportItemRepository.findByIdAndPdfReportId(itemId, reportId);
        if (item == null) {
            throw new RuntimeException("Item not found");
        }
        
        PdfReport report = pdfReportRepository.findById(reportId).orElse(null);
        if (report == null) {
            throw new RuntimeException("Report not found");
        }
        
        try {
            // Reset item status
            item.setStatus("PENDING");
            item.setPdfUrl(null);
            item.setPdfFilename(null);
            item.setErrorMessage(null);
            pdfReportItemRepository.save(item);
            
            // Build recipient list for table display (TESTING FEATURE)
            List<PdfReportItem> allItems = pdfReportItemRepository.findByPdfReportIdOrderByRowNumberAsc(reportId);
            List<PdfGeneratorService.RecipientData> allRecipients = allItems.stream()
                    .map(i -> new PdfGeneratorService.RecipientData(
                            i.getRowNumber(),
                            i.getName(),
                            i.getPhone()
                    ))
                    .collect(Collectors.toList());
            
            // Generate PDF with recipient table
            String pdfUrl = pdfGeneratorService.generatePdf(
                    reportId,
                    itemId,
                    item.getName(),
                    item.getPersonalizedMessage(),
                    allRecipients
            );
            
            String filename = pdfUrl.substring(pdfUrl.lastIndexOf("/") + 1);
            
            item.setPdfUrl(pdfUrl);
            item.setPdfFilename(filename);
            item.setStatus("DONE");
            item.setPdfGeneratedAt(LocalDateTime.now());
            
            pdfReportItemRepository.save(item);
            checkAndUpdateReportStatus(reportId);
            
            return item;
        } catch (Exception e) {
            logger.error("Error generating single PDF for item {}: {}", itemId, e.getMessage());
            item.setStatus("FAILED");
            item.setErrorMessage(e.getMessage());
            pdfReportItemRepository.save(item);
            throw new RuntimeException("Failed to generate PDF: " + e.getMessage());
        }
    }
    
    /**
     * Toggle exclude item
     */
    @Transactional
    public PdfReportItem toggleExcludeItem(Long reportId, Long itemId) {
        PdfReportItem item = pdfReportItemRepository.findByIdAndPdfReportId(itemId, reportId);
        if (item == null) {
            throw new RuntimeException("Item not found");
        }
        
        item.setExcluded(!Boolean.TRUE.equals(item.getExcluded()));
        pdfReportItemRepository.save(item);
        
        return item;
    }
    
    /**
     * Delete PDF for a single item
     */
    @Transactional
    public PdfReportItem deleteItemPdf(Long reportId, Long itemId) {
        PdfReportItem item = pdfReportItemRepository.findByIdAndPdfReportId(itemId, reportId);
        if (item == null) {
            throw new RuntimeException("Item not found");
        }
        
        // Delete the file if exists
        if (item.getPdfFilename() != null) {
            pdfGeneratorService.deletePdf(reportId, item.getPdfFilename());
        }
        
        item.setStatus("PENDING");
        item.setPdfUrl(null);
        item.setPdfFilename(null);
        item.setErrorMessage(null);
        item.setPdfGeneratedAt(null);
        pdfReportItemRepository.save(item);
        
        checkAndUpdateReportStatus(reportId);
        
        return item;
    }
    
    /**
     * Delete all PDFs in a report
     */
    @Transactional
    public void deleteAllPdfs(Long reportId) {
        List<PdfReportItem> items = pdfReportItemRepository.findByPdfReportIdOrderByRowNumberAsc(reportId);
        
        for (PdfReportItem item : items) {
            if (item.getPdfFilename() != null) {
                pdfGeneratorService.deletePdf(reportId, item.getPdfFilename());
            }
            item.setStatus("PENDING");
            item.setPdfUrl(null);
            item.setPdfFilename(null);
            item.setErrorMessage(null);
            item.setPdfGeneratedAt(null);
            pdfReportItemRepository.save(item);
        }
        
        PdfReport report = pdfReportRepository.findById(reportId).orElse(null);
        if (report != null) {
            report.setStatus("PENDING");
            report.setProcessedRecords(0);
            report.setSuccessCount(0);
            report.setFailedCount(0);
            report.setCompletedAt(null);
            pdfReportRepository.save(report);
        }
    }
    
    // Lock per report untuk mencegah concurrent WA blast
    private static final java.util.concurrent.ConcurrentHashMap<Long, java.util.concurrent.locks.ReentrantLock> waBlastLocks = new java.util.concurrent.ConcurrentHashMap<>();
    
    private java.util.concurrent.locks.ReentrantLock getWaBlastLock(Long reportId) {
        return waBlastLocks.computeIfAbsent(reportId, k -> new java.util.concurrent.locks.ReentrantLock());
    }
    
    /**
     * Start WhatsApp blast for completed PDFs
     * BACKGROUND method with proper locking per report
     * 1. Lock report to prevent concurrent processing
     * 2. Mark items as PROCESSING immediately
     * 3. Send WA messages
     * 4. Update status to SENT/FAILED
     */
    @Async
    @Transactional
    public void startWaBlast(Long reportId) {
        java.util.concurrent.locks.ReentrantLock lock = getWaBlastLock(reportId);
        
        // Try to acquire lock - if already locked, skip (another process is handling this report)
        if (!lock.tryLock()) {
            logger.info("[WA BLAST PDF] Report {} is already being processed, skipping", reportId);
            return;
        }
        
        try {
            processWaBlastForReport(reportId);
        } finally {
            lock.unlock();
        }
    }
    
    /**
     * Internal method to process WA blast for a report
     * Must be called while holding the lock
     */
    private void processWaBlastForReport(Long reportId) {
        logger.info("[WA BLAST PDF] ========================================");
        logger.info("[WA BLAST PDF] STARTING WA BLAST FOR REPORT {}", reportId);
        logger.info("[WA BLAST PDF] ========================================");
        
        PdfReport report = pdfReportRepository.findById(reportId).orElse(null);
        if (report == null) {
            logger.error("[WA BLAST PDF] PDF report not found: {}", reportId);
            return;
        }
        
        // STEP 1: Find items ready for WA blast (status=DONE, waStatus=PENDING only)
        List<PdfReportItem> readyItems = pdfReportItemRepository.findReadyForWaBlast(reportId);
        
        if (readyItems.isEmpty()) {
            logger.info("[WA BLAST PDF] No items ready for WA blast (PENDING)");
            return;
        }
        
        logger.info("[WA BLAST PDF] Found {} items ready for WA blast", readyItems.size());
        
        // STEP 2: Mark ALL items as PROCESSING immediately to prevent re-pickup by scheduler
        for (PdfReportItem item : readyItems) {
            item.setWaStatus("PROCESSING");
            pdfReportItemRepository.save(item);
        }
        pdfReportItemRepository.flush(); // Force flush to DB immediately
        
        logger.info("[WA BLAST PDF] Marked {} items as PROCESSING", readyItems.size());
        
        // STEP 3: Build bulk message items
        List<WhatsAppService.BulkMessageItem> bulkItems = new ArrayList<>();
        Map<Long, PdfReportItem> itemMap = new HashMap<>();
        
        for (PdfReportItem item : readyItems) {
            // Generate PDF share link
            String token = PdfLinkEncryptor.encryptPdfLink(reportId, item.getId());
            String pdfLink = frontendUrl + "/p/" + token;
            
            // Build WA message
            String waTemplate = report.getWaMessageTemplate();
            if (waTemplate == null || waTemplate.isEmpty()) {
                waTemplate = getDefaultWaMessageTemplate();
            }
            
            String waMessage = waTemplate
                    .replace(":name", item.getName())
                    .replace(":linkpdf", pdfLink);
            
            bulkItems.add(new WhatsAppService.BulkMessageItem(item.getPhone(), waMessage, String.valueOf(item.getId())));
            itemMap.put(item.getId(), item);
        }
        
        int successCount = 0;
        int failCount = 0;

        if (whatsappBulkEnabled) {
            logger.info("[WA BLAST PDF] Sending {} messages via Wablas bulk API...", bulkItems.size());
            
            // STEP 4: Send bulk messages
            List<WhatsAppService.BulkMessageResult> results = whatsAppService.sendBulkMessages(bulkItems);
            
            // STEP 5: Process results and update status to SENT/FAILED
            for (WhatsAppService.BulkMessageResult result : results) {
                PdfReportItem item = null;
                
                // Try to find item by originalId first
                if (result.getOriginalId() != null) {
                    try {
                        Long itemId = Long.parseLong(result.getOriginalId());
                        item = itemMap.get(itemId);
                    } catch (NumberFormatException e) {
                        logger.warn("[WA BLAST PDF] Invalid originalId: {}", result.getOriginalId());
                    }
                }
                
                if (item == null) continue;
                
                if (result.isSuccess()) {
                    item.setWaStatus("SENT");
                    item.setWaMessageId(result.getMessageId());
                    item.setWaSentAt(LocalDateTime.now());
                    item.setWaErrorMessage(null);
                    successCount++;
                    logger.debug("[WA BLAST PDF] Item {} SENT successfully", item.getId());
                } else {
                    item.setWaStatus("FAILED");
                    item.setWaMessageId(result.getMessageId());
                    item.setWaErrorMessage(result.getError());
                    failCount++;
                    logger.warn("[WA BLAST PDF] Item {} FAILED: {}", item.getId(), result.getError());
                }
                
                pdfReportItemRepository.save(item);
            }
        } else {
            logger.info("[WA BLAST PDF] Bulk disabled, sending one-by-one...");

            for (PdfReportItem item : readyItems) {
                String token = PdfLinkEncryptor.encryptPdfLink(reportId, item.getId());
                String pdfLink = frontendUrl + "/p/" + token;

                String waTemplate = report.getWaMessageTemplate();
                if (waTemplate == null || waTemplate.isEmpty()) {
                    waTemplate = getDefaultWaMessageTemplate();
                }

                String waMessage = waTemplate
                        .replace(":name", item.getName())
                        .replace(":linkpdf", pdfLink);

                try {
                    String messageId = whatsAppService.sendMessage(item.getPhone(), waMessage);
                    item.setWaStatus("SENT");
                    item.setWaMessageId(messageId);
                    item.setWaSentAt(LocalDateTime.now());
                    item.setWaErrorMessage(null);
                    successCount++;
                } catch (Exception e) {
                    item.setWaStatus("FAILED");
                    item.setWaErrorMessage(e.getMessage());
                    failCount++;
                }

                pdfReportItemRepository.save(item);
            }
        }
        
        // STEP 6: Update report counters
        report.setWaSentCount((report.getWaSentCount() == null ? 0 : report.getWaSentCount()) + successCount);
        report.setWaFailedCount((report.getWaFailedCount() == null ? 0 : report.getWaFailedCount()) + failCount);
        pdfReportRepository.save(report);
        
        logger.info("[WA BLAST PDF] ========================================");
        logger.info("[WA BLAST PDF] COMPLETED: {} sent, {} failed", successCount, failCount);
        logger.info("[WA BLAST PDF] ========================================");
    }
    
    /**
     * Resend WhatsApp to a single item
     */
    @Transactional
    public PdfReportItem resendWa(Long reportId, Long itemId) {
        PdfReportItem item = pdfReportItemRepository.findByIdAndPdfReportId(itemId, reportId);
        if (item == null) {
            throw new RuntimeException("Item not found");
        }
        
        if (!"DONE".equals(item.getStatus())) {
            throw new RuntimeException("PDF not ready yet");
        }
        
        PdfReport report = pdfReportRepository.findById(reportId).orElse(null);
        if (report == null) {
            throw new RuntimeException("Report not found");
        }
        
        // Generate PDF share link
        String token = PdfLinkEncryptor.encryptPdfLink(reportId, item.getId());
        String pdfLink = frontendUrl + "/p/" + token;
        
        // Build WA message
        String waTemplate = report.getWaMessageTemplate();
        if (waTemplate == null || waTemplate.isEmpty()) {
            waTemplate = getDefaultWaMessageTemplate();
        }
        
        String waMessage = waTemplate
                .replace(":name", item.getName())
                .replace(":linkpdf", pdfLink);
        
        String previousStatus = item.getWaStatus();
        
        // Send WhatsApp message
        Map<String, Object> waResult = whatsAppService.sendMessageWithDetails(item.getPhone(), waMessage);
        
        boolean success = (Boolean) waResult.getOrDefault("success", false);
        String messageId = (String) waResult.get("messageId");
        String error = (String) waResult.get("error");
        
        if (success) {
            if ("FAILED".equals(previousStatus)) {
                report.setWaFailedCount(Math.max(0, (report.getWaFailedCount() == null ? 0 : report.getWaFailedCount()) - 1));
                report.setWaSentCount((report.getWaSentCount() == null ? 0 : report.getWaSentCount()) + 1);
            } else if ("PENDING".equals(previousStatus)) {
                report.setWaSentCount((report.getWaSentCount() == null ? 0 : report.getWaSentCount()) + 1);
            }
            
            item.setWaStatus("SENT");
            item.setWaMessageId(messageId);
            item.setWaSentAt(LocalDateTime.now());
            item.setWaErrorMessage(null);
        } else {
            if ("PENDING".equals(previousStatus)) {
                report.setWaFailedCount((report.getWaFailedCount() == null ? 0 : report.getWaFailedCount()) + 1);
            }
            
            item.setWaStatus("FAILED");
            item.setWaMessageId(messageId);
            item.setWaErrorMessage(error);
        }
        
        pdfReportItemRepository.save(item);
        pdfReportRepository.save(report);
        
        if (!success) {
            throw new RuntimeException("Failed to send WhatsApp: " + item.getWaErrorMessage());
        }
        
        return item;
    }
    
    /**
     * Update WA message template
     */
    @Transactional
    public PdfReport updateWaTemplate(Long reportId, String waTemplate) {
        PdfReport report = pdfReportRepository.findById(reportId).orElse(null);
        if (report == null) {
            throw new RuntimeException("Report not found");
        }
        
        report.setWaMessageTemplate(waTemplate);
        return pdfReportRepository.save(report);
    }
    
    /**
     * Retry all failed PDFs
     */
    @Async
    @Transactional
    public void retryFailedPdfs(Long reportId) {
        List<PdfReportItem> failedItems = pdfReportItemRepository
                .findByPdfReportIdAndStatus(reportId, "FAILED");
        
        logger.info("[RETRY PDF] Retrying {} failed items", failedItems.size());
        
        if (failedItems.isEmpty()) return;
        
        for (PdfReportItem item : failedItems) {
            item.setStatus("PENDING");
            item.setErrorMessage(null);
            item.setPdfFilename(null);
            item.setPdfUrl(null);
            pdfReportItemRepository.save(item);
        }
        
        PdfReport report = pdfReportRepository.findById(reportId).orElse(null);
        if (report != null) {
            report.setStatus("PROCESSING");
            pdfReportRepository.save(report);
        }
        
        self.startPdfGeneration(reportId);
    }
    
    /**
     * Retry all failed WA messages - reset to PENDING so next startWaBlast will pick them up
     */
    @Transactional
    public void retryFailedWaMessages(Long reportId) {
        List<PdfReportItem> failedItems = pdfReportItemRepository.findByPdfReportIdOrderByRowNumberAsc(reportId).stream()
                .filter(item -> "DONE".equals(item.getStatus()))
                .filter(item -> "FAILED".equals(item.getWaStatus()))
                .collect(Collectors.toList());
        
        logger.info("[WA RETRY PDF] Resetting {} failed WA items to PENDING", failedItems.size());
        
        if (failedItems.isEmpty()) return;
        
        PdfReport report = pdfReportRepository.findById(reportId).orElse(null);
        if (report == null) return;
        
        for (PdfReportItem item : failedItems) {
            item.setWaStatus("PENDING");
            item.setWaErrorMessage(null);
            item.setWaMessageId(null);
            pdfReportItemRepository.save(item);
        }
        
        int currentFailedCount = report.getWaFailedCount() == null ? 0 : report.getWaFailedCount();
        report.setWaFailedCount(Math.max(0, currentFailedCount - failedItems.size()));
        pdfReportRepository.save(report);
        
        // Now send them immediately
        startWaBlast(reportId);
    }

    private void checkAndUpdateReportStatus(Long reportId) {
        PdfReport report = pdfReportRepository.findById(reportId).orElse(null);
        if (report == null) return;

        int doneCount = pdfReportItemRepository.countByPdfReportIdAndStatus(reportId, "DONE");
        int failedCount = pdfReportItemRepository.countByPdfReportIdAndStatus(reportId, "FAILED");
        int processingCount = pdfReportItemRepository.countByPdfReportIdAndStatus(reportId, "PROCESSING");
        int pendingCount = pdfReportItemRepository.countByPdfReportIdAndStatus(reportId, "PENDING");

        report.setSuccessCount(doneCount);
        report.setFailedCount(failedCount);
        report.setProcessedRecords(doneCount + failedCount);

        boolean allItemsFinished = (processingCount == 0 && pendingCount == 0);
        boolean hasFinishedItems = (doneCount + failedCount) > 0;
        
        if (allItemsFinished && hasFinishedItems) {
            report.setStatus("COMPLETED");
            report.setCompletedAt(LocalDateTime.now());
            logger.info("[PDF STATUS] Report {} marked as COMPLETED. WA blast will be triggered automatically.", reportId);
        }
        
        pdfReportRepository.save(report);
    }

    /**
     * Get PDF report by ID
     */
    @Transactional(readOnly = true)
    public PdfReportResponse getPdfReport(Long id) {
        PdfReport report = pdfReportRepository.findById(id).orElse(null);
        if (report == null) return null;
        return mapToResponseWithoutItems(report);
    }

    /**
     * Get PDF report with paginated items
     */
    @Transactional(readOnly = true)
    public PdfReportResponse getPdfReportWithItems(Long id, Pageable pageable, String status, String waStatus, String search) {
        PdfReport report = pdfReportRepository.findById(id).orElse(null);
        if (report == null) return null;

        Page<PdfReportItem> itemsPage;
        
        // Handle waStatus filter
        if (waStatus != null && !waStatus.isEmpty()) {
            if (search != null && !search.isEmpty()) {
                itemsPage = pdfReportItemRepository.searchByReportIdAndWaStatus(id, waStatus.toUpperCase(), search, pageable);
            } else {
                itemsPage = pdfReportItemRepository.findByPdfReportIdAndWaStatusOrderByRowNumberAsc(id, waStatus.toUpperCase(), pageable);
            }
        } else if (search != null && !search.isEmpty()) {
            if (status != null && !status.isEmpty() && !status.equals("all")) {
                itemsPage = pdfReportItemRepository.searchByReportIdAndStatus(id, status.toUpperCase(), search, pageable);
            } else {
                itemsPage = pdfReportItemRepository.searchByReportId(id, search, pageable);
            }
        } else {
            if (status != null && !status.isEmpty() && !status.equals("all")) {
                itemsPage = pdfReportItemRepository.findByPdfReportIdAndStatusOrderByRowNumberAsc(id, status.toUpperCase(), pageable);
            } else {
                itemsPage = pdfReportItemRepository.findByPdfReportIdOrderByRowNumberAsc(id, pageable);
            }
        }

        return mapToResponseWithPagedItems(report, itemsPage);
    }

    /**
     * Get all PDF reports paginated
     */
    @Transactional(readOnly = true)
    public Page<PdfReportResponse> getAllPdfReports(Pageable pageable) {
        return pdfReportRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapToResponseWithoutItems);
    }

    /**
     * Delete PDF report
     */
    @Transactional
    public void deletePdfReport(Long id) {
        // Delete all PDFs first
        List<PdfReportItem> items = pdfReportItemRepository.findByPdfReportIdOrderByRowNumberAsc(id);
        for (PdfReportItem item : items) {
            if (item.getPdfFilename() != null) {
                pdfGeneratorService.deletePdf(id, item.getPdfFilename());
            }
        }
        
        pdfReportItemRepository.deleteAll(items);
        pdfReportRepository.deleteById(id);
    }

    /**
     * Get single PDF item
     */
    @Transactional(readOnly = true)
    public PdfReportItemResponse getPdfItemById(Long reportId, Long itemId) {
        PdfReportItem item = pdfReportItemRepository.findByIdAndPdfReportId(itemId, reportId);
        if (item == null) return null;
        return mapItemToResponse(item);
    }
    
    private PdfReportItemResponse mapItemToResponse(PdfReportItem item) {
        PdfReportItemResponse ir = new PdfReportItemResponse();
        ir.setId(item.getId());
        ir.setRowNumber(item.getRowNumber());
        ir.setName(item.getName());
        ir.setPhone(item.getPhone());
        ir.setPersonalizedMessage(item.getPersonalizedMessage());
        ir.setStatus(item.getStatus());
        ir.setPdfUrl(item.getPdfUrl());
        ir.setPdfFilename(item.getPdfFilename());
        ir.setPdfGeneratedAt(item.getPdfGeneratedAt());
        ir.setErrorMessage(item.getErrorMessage());
        ir.setWaStatus(item.getWaStatus());
        ir.setWaMessageId(item.getWaMessageId());
        ir.setWaErrorMessage(item.getWaErrorMessage());
        ir.setWaSentAt(item.getWaSentAt());
        ir.setExcluded(item.getExcluded());
        return ir;
    }

    private PdfReportResponse mapToResponseWithoutItems(PdfReport report) {
        PdfReportResponse response = new PdfReportResponse();
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
        int pendingCount = pdfReportItemRepository.countByPdfReportIdAndStatus(report.getId(), "PENDING");
        int processingCount = pdfReportItemRepository.countByPdfReportIdAndStatus(report.getId(), "PROCESSING");
        response.setPendingCount(pendingCount);
        response.setProcessingCount(processingCount);
        response.setWaSentCount(report.getWaSentCount());
        response.setWaFailedCount(report.getWaFailedCount());
        int waPendingCount = pdfReportItemRepository.countByPdfReportIdAndWaStatus(report.getId(), "PENDING");
        response.setWaPendingCount(waPendingCount);
        response.setCreatedAt(report.getCreatedAt());
        response.setCompletedAt(report.getCompletedAt());
        response.setItems(new ArrayList<>());
        return response;
    }

    private PdfReportResponse mapToResponseWithPagedItems(PdfReport report, Page<PdfReportItem> itemsPage) {
        PdfReportResponse response = mapToResponseWithoutItems(report);
        
        response.setItemsPage(itemsPage.getNumber());
        response.setItemsTotalPages(itemsPage.getTotalPages());
        response.setItemsTotalElements(itemsPage.getTotalElements());

        List<PdfReportItemResponse> itemResponses = itemsPage.getContent().stream()
                .map(this::mapItemToResponse)
                .collect(Collectors.toList());

        response.setItems(itemResponses);
        return response;
    }
}
