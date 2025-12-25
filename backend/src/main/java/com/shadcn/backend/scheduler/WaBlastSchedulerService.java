package com.shadcn.backend.scheduler;

import com.shadcn.backend.entity.VideoReport;
import com.shadcn.backend.entity.PdfReport;
import com.shadcn.backend.entity.PdfReportItem;
import com.shadcn.backend.repository.VideoReportItemRepository;
import com.shadcn.backend.repository.VideoReportRepository;
import com.shadcn.backend.repository.PdfReportItemRepository;
import com.shadcn.backend.repository.PdfReportRepository;
import com.shadcn.backend.service.VideoReportService;
import com.shadcn.backend.service.PdfReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Scheduler Service for WA Blast and Recovery
 * 
 * This scheduler handles:
 * 1. Send pending WA messages for completed PDF/Video items (every 30 seconds)
 * 2. Recovery stuck PDF items (status PROCESSING > 10 minutes)
 * 3. (disabled) Recovery stuck Video items
 * 
 * NOTE: PDF/Video generation is NOT auto-triggered by scheduler
 * Generation only starts from user action (button click)
 */
@Service
public class WaBlastSchedulerService {
    
    private static final Logger logger = LoggerFactory.getLogger(WaBlastSchedulerService.class);
    
    @Autowired
    private VideoReportItemRepository videoReportItemRepository;
    
    @Autowired
    private VideoReportRepository videoReportRepository;
    
    @Autowired
    private PdfReportItemRepository pdfReportItemRepository;
    
    @Autowired
    private PdfReportRepository pdfReportRepository;
    
    @Autowired
    @Lazy
    private VideoReportService videoReportService;
    
    @Autowired
    @Lazy
    private PdfReportService pdfReportService;

    @org.springframework.beans.factory.annotation.Value("${whatsapp.wablas.status-sync.enabled:false}")
    private boolean wablasStatusSyncEnabled;

    
    /**
     * Scheduler: Send pending WA messages for completed PDF items every 30 seconds
     * Only sends WA for items with status=DONE and waStatus=PENDING
     * Does NOT trigger PDF generation - only sends WA for already completed PDFs
     */
    @Scheduled(fixedRate = 30000, initialDelay = 10000) // 30 seconds, start after 10 sec
    public void sendPendingPdfWaMessages() {
        try {
            // Find all PDF reports that have items ready for WA blast
            List<PdfReport> reports = pdfReportRepository.findReportsWithPendingWaItems();
            
            if (reports.isEmpty()) {
                return;
            }
            
            for (PdfReport report : reports) {
                try {
                    // Check how many items are ready for WA
                    int readyCount = pdfReportItemRepository.countReadyForWaBlast(report.getId());
                    if (readyCount > 0) {
                        logger.info("[WA SCHEDULER PDF] Report {} has {} pending WA items, triggering blast", report.getId(), readyCount);
                        pdfReportService.startWaBlast(report.getId());
                    }
                } catch (Exception e) {
                    logger.error("[WA SCHEDULER PDF] Error for report {}: {}", report.getId(), e.getMessage());
                }
            }
            
        } catch (Exception e) {
            logger.error("[WA SCHEDULER PDF] Error: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Scheduler: Send pending WA messages for completed Video items every 30 seconds
     * Only sends WA for items with status=DONE and waStatus=PENDING
     * Does NOT trigger Video generation - only sends WA for already completed Videos
     */
    @Scheduled(fixedRate = 30000, initialDelay = 15000) // 30 seconds, start after 15 sec
    public void sendPendingVideoWaMessages() {
        try {
            // Find all Video reports that have items ready for WA blast
            List<VideoReport> reports = videoReportRepository.findReportsWithPendingWaItems();
            
            if (reports.isEmpty()) {
                return;
            }
            
            for (VideoReport report : reports) {
                try {
                    // Check how many items are ready for WA
                    int readyCount = videoReportItemRepository.countReadyForWaBlast(report.getId());
                    if (readyCount > 0) {
                        logger.info("[WA SCHEDULER VIDEO] Report {} has {} pending WA items, triggering blast", report.getId(), readyCount);
                        videoReportService.startWaBlast(report.getId());
                    }
                } catch (Exception e) {
                    logger.error("[WA SCHEDULER VIDEO] Error for report {}: {}", report.getId(), e.getMessage());
                }
            }
            
        } catch (Exception e) {
            logger.error("[WA SCHEDULER VIDEO] Error: {}", e.getMessage(), e);
        }
    }


    /**
     * Scheduler: Poll D-ID clip statuses for video items in PROCESSING state
     * When D-ID returns done/result_url, items will be marked DONE and WA blast will pick them up.
     */
    @Scheduled(fixedRate = 30000, initialDelay = 20000) // 30 seconds, start after 20 sec
    public void pollProcessingVideoClips() {
        try {
            List<Long> reportIds = videoReportItemRepository.findDistinctReportIdsByStatus("PROCESSING");
            if (reportIds.isEmpty()) {
                return;
            }

            for (Long reportId : reportIds) {
                try {
                    videoReportService.checkPendingClips(reportId);
                } catch (Exception e) {
                    logger.error("[VIDEO CLIP POLL] Error for report {}: {}", reportId, e.getMessage());
                }
            }
        } catch (Exception e) {
            logger.error("[VIDEO CLIP POLL] Error: {}", e.getMessage(), e);
        }
    }
    

    /**
     * Scheduler: Sync queued/sent WA message statuses from Wablas every 5 minutes
     * Updates item waStatus based on message_id report endpoint
     */
    @Scheduled(fixedRate = 300000, initialDelay = 60000) // Every 5 minutes, start after 1 min
    public void syncQueuedVideoWaStatuses() {
        try {
            if (!wablasStatusSyncEnabled) {
                return;
            }

            List<VideoReport> reports = videoReportRepository.findReportsWithWaItemsToSync();
            if (reports.isEmpty()) {
                return;
            }

            for (VideoReport report : reports) {
                try {
                    logger.info("[WA SYNC SCHEDULER VIDEO] Syncing WA statuses for report {}", report.getId());
                    videoReportService.syncWaStatus(report.getId());
                } catch (Exception e) {
                    logger.error("[WA SYNC SCHEDULER VIDEO] Error for report {}: {}", report.getId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            logger.error("[WA SYNC SCHEDULER VIDEO] Error: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Scheduler: Auto-recover stuck PDF items every 10 minutes
     * Items stuck in status PROCESSING for > 10 minutes will be reset to PENDING for retry
     * NOTE: This does NOT auto-generate PDF - only resets stuck items for manual retry
     */
    @Scheduled(fixedRate = 600000, initialDelay = 300000) // 10 minutes, start after 5 min
    public void recoverStuckPdfItems() {
        try {
            LocalDateTime threshold = LocalDateTime.now().minusMinutes(10);
            List<PdfReportItem> stuckItems = pdfReportItemRepository.findStuckProcessingItems(threshold);
            
            if (stuckItems.isEmpty()) {
                return;
            }
            
            logger.warn("[RECOVERY PDF] Found {} PDF items stuck in PROCESSING, resetting to PENDING...", stuckItems.size());
            
            for (PdfReportItem item : stuckItems) {
                item.setStatus("PENDING");
                item.setErrorMessage("Auto-recovered from stuck PROCESSING state");
                pdfReportItemRepository.save(item);
                logger.info("[RECOVERY PDF] Reset item {} (report {}) to PENDING", item.getId(), item.getPdfReport().getId());
            }
            
            // NOTE: We do NOT auto-trigger PDF generation here
            // User must manually click "Generate" button to retry
            // Just update the report status
            Set<Long> affectedReportIds = stuckItems.stream()
                    .map(item -> item.getPdfReport().getId())
                    .collect(Collectors.toSet());
            
            for (Long reportId : affectedReportIds) {
                PdfReport report = pdfReportRepository.findById(reportId).orElse(null);
                if (report != null) {
                    // Update counts
                    int pendingCount = pdfReportItemRepository.countByPdfReportIdAndStatus(reportId, "PENDING");
                    int doneCount = pdfReportItemRepository.countByPdfReportIdAndStatus(reportId, "DONE");
                    int failedCount = pdfReportItemRepository.countByPdfReportIdAndStatus(reportId, "FAILED");
                    
                    report.setSuccessCount(doneCount);
                    report.setFailedCount(failedCount);
                    
                    // If there are pending items, set status back to PENDING so user knows to retry
                    if (pendingCount > 0) {
                        report.setStatus("PENDING");
                    }
                    pdfReportRepository.save(report);
                    logger.info("[RECOVERY PDF] Updated report {} status - Pending: {}, Done: {}, Failed: {}", 
                            reportId, pendingCount, doneCount, failedCount);
                }
            }
            
        } catch (Exception e) {
            logger.error("[RECOVERY PDF] Error: {}", e.getMessage(), e);
        }
    }
    
}
