package com.shadcn.backend.controller;

import com.shadcn.backend.entity.VideoReportItem;
import com.shadcn.backend.repository.VideoReportItemRepository;
import com.shadcn.backend.service.VideoReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/did/webhook")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.POST, RequestMethod.OPTIONS})
public class DIDWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(DIDWebhookController.class);

    private final VideoReportItemRepository videoReportItemRepository;
    private final VideoReportService videoReportService;

    @Value("${app.did.webhook.secret:}")
    private String webhookSecret;

    public DIDWebhookController(VideoReportItemRepository videoReportItemRepository, VideoReportService videoReportService) {
        this.videoReportItemRepository = videoReportItemRepository;
        this.videoReportService = videoReportService;
    }

    @PostMapping("/clips")
    public ResponseEntity<?> clipsWebhook(
            @RequestBody(required = false) Map<String, Object> payload,
            @RequestHeader(value = "X-DID-Webhook-Secret", required = false) String providedSecret
    ) {
        try {
            if (webhookSecret != null && !webhookSecret.isBlank()) {
                String expected = webhookSecret.trim();
                String got = providedSecret == null ? "" : providedSecret.trim();
                if (!expected.equals(got)) {
                    return ResponseEntity.status(401).build();
                }
            }

            if (payload == null || payload.isEmpty()) {
                return ResponseEntity.ok().build();
            }

            String clipId = asString(payload.get("id"));
            String status = asString(payload.get("status"));
            String resultUrl = asString(payload.get("result_url"));

            if (clipId == null || clipId.isBlank()) {
                return ResponseEntity.ok().build();
            }

            VideoReportItem item = videoReportItemRepository.findByDidClipId(clipId);
            if (item == null) {
                return ResponseEntity.ok().build();
            }

            if (status != null && status.equalsIgnoreCase("done") && resultUrl != null && !resultUrl.isBlank()) {
                boolean changed = false;

                if (item.getVideoUrl() == null || item.getVideoUrl().isBlank() || !item.getVideoUrl().equals(resultUrl)) {
                    item.setVideoUrl(resultUrl);
                    changed = true;
                }

                if (!"DONE".equalsIgnoreCase(item.getStatus())) {
                    item.setStatus("DONE");
                    item.setErrorMessage(null);
                    changed = true;
                }

                if (item.getVideoGeneratedAt() == null) {
                    item.setVideoGeneratedAt(LocalDateTime.now());
                    changed = true;
                }

                if (changed) {
                    videoReportItemRepository.save(item);
                }

                Long reportId = null;
                try {
                    if (item.getVideoReport() != null) {
                        reportId = item.getVideoReport().getId();
                    }
                } catch (Exception ignore) {
                }

                if (reportId != null) {
                    videoReportService.enqueueShareCacheDownloadIfNeeded(reportId, item.getId(), resultUrl);
                }
            }

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.warn("D-ID webhook handling failed: {}", e.getMessage());
            return ResponseEntity.ok().build();
        }
    }

    private static String asString(Object v) {
        return v == null ? null : String.valueOf(v);
    }
}
