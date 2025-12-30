package com.shadcn.backend.controller;

import com.shadcn.backend.entity.VideoReportItem;
import com.shadcn.backend.repository.VideoReportItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/wablas")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.POST, RequestMethod.OPTIONS})
public class WablasWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(WablasWebhookController.class);

    private final VideoReportItemRepository videoReportItemRepository;

    @Value("${whatsapp.wablas.tracking.enabled:true}")
    private boolean trackingEnabled;

    @Value("${whatsapp.wablas.tracking.secret:}")
    private String trackingSecret;

    @Value("${whatsapp.wablas.timezone:Asia/Jakarta}")
    private String wablasTimezone;

    public WablasWebhookController(VideoReportItemRepository videoReportItemRepository) {
        this.videoReportItemRepository = videoReportItemRepository;
    }

    @PostMapping("/tracking")
    public ResponseEntity<Map<String, Object>> tracking(
            @RequestHeader(value = "X-Wablas-Secret", required = false) String secretHeader,
            @RequestParam(value = "secret", required = false) String secretParam,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        Map<String, Object> res = new HashMap<>();

        if (!trackingEnabled) {
            res.put("success", true);
            res.put("disabled", true);
            return ResponseEntity.ok(res);
        }

        String configured = trackingSecret == null ? "" : trackingSecret.trim();
        if (!configured.isEmpty()) {
            String provided = secretHeader != null && !secretHeader.isBlank() ? secretHeader : secretParam;
            provided = provided == null ? "" : provided.trim();
            if (!configured.equals(provided)) {
                res.put("success", false);
                res.put("error", "Unauthorized");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(res);
            }
        }

        if (payload == null) {
            res.put("success", true);
            res.put("ignored", true);
            return ResponseEntity.ok(res);
        }

        String messageId = firstNonBlank(
                stringValue(payload.get("message_id")),
                stringValue(payload.get("messageId")),
                stringValue(payload.get("id"))
        );

        String status = firstNonBlank(
                stringValue(payload.get("status")),
                stringValue(payload.get("message_status")),
                stringValue(payload.get("messageStatus"))
        );

        if (messageId == null || messageId.isBlank()) {
            res.put("success", true);
            res.put("ignored", true);
            res.put("reason", "Missing message_id");
            return ResponseEntity.ok(res);
        }

        VideoReportItem item;
        try {
            item = videoReportItemRepository.findByWaMessageId(messageId);
        } catch (Exception e) {
            item = null;
        }

        if (item == null) {
            res.put("success", true);
            res.put("ignored", true);
            res.put("reason", "Unknown message_id");
            return ResponseEntity.ok(res);
        }

        String old = item.getWaStatus();
        String mapped = mapWablasStatus(status);

        if (mapped != null) {
            item.setWaStatus(mapped);
            if ("ERROR".equals(mapped)) {
                item.setWaErrorMessage("Wablas status: " + (status == null ? "" : status));
            } else {
                item.setWaErrorMessage(null);
            }
        }

        LocalDateTime providerTime = extractProviderTime(payload);
        if (providerTime != null) {
            item.setWaSentAt(providerTime);
        }

        try {
            videoReportItemRepository.save(item);
        } catch (Exception e) {
            logger.warn("[WABLAS TRACKING] Failed saving status update for messageId {}: {}", messageId, e.getMessage());
        }

        res.put("success", true);
        res.put("messageId", messageId);
        res.put("oldStatus", old);
        res.put("newStatus", item.getWaStatus());
        return ResponseEntity.ok(res);
    }

    private String mapWablasStatus(String wablasStatus) {
        if (wablasStatus == null) {
            return null;
        }
        String s = wablasStatus.trim().toLowerCase();
        return switch (s) {
            case "pending" -> "QUEUED";
            case "sent" -> "SENT";
            case "delivered", "received", "read" -> "DELIVERED";
            case "cancel", "rejected", "failed" -> "ERROR";
            default -> null;
        };
    }

    private LocalDateTime extractProviderTime(Map<String, Object> payload) {
        Object date = payload.get("date");
        if (date instanceof Map<?, ?> m) {
            Object updatedAt = m.get("updated_at");
            Object createdAt = m.get("created_at");
            LocalDateTime parsed = parseDateTime(stringValue(updatedAt));
            if (parsed != null) {
                return parsed;
            }
            return parseDateTime(stringValue(createdAt));
        }

        LocalDateTime parsed = parseDateTime(firstNonBlank(
                stringValue(payload.get("updated_at")),
                stringValue(payload.get("updatedAt"))
        ));
        if (parsed != null) {
            return parsed;
        }

        return parseDateTime(firstNonBlank(
                stringValue(payload.get("created_at")),
                stringValue(payload.get("createdAt"))
        ));
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String s = value.trim();
        try {
            return LocalDateTime.parse(s, java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        } catch (Exception ignore) {
        }
        try {
            return LocalDateTime.parse(s, java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS"));
        } catch (Exception ignore) {
        }
        try {
            return LocalDateTime.parse(s, java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (Exception ignore) {
        }
        try {
            if (s.endsWith("Z")) {
                java.time.Instant instant = java.time.Instant.parse(s);
                return LocalDateTime.ofInstant(instant, java.time.ZoneId.of(wablasTimezone == null || wablasTimezone.isBlank() ? "Asia/Jakarta" : wablasTimezone.trim()));
            }
        } catch (Exception ignore) {
        }
        try {
            java.time.OffsetDateTime odt = java.time.OffsetDateTime.parse(s, java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME);
            return LocalDateTime.ofInstant(odt.toInstant(), java.time.ZoneId.of(wablasTimezone == null || wablasTimezone.isBlank() ? "Asia/Jakarta" : wablasTimezone.trim()));
        } catch (Exception ignore) {
        }

        return null;
    }

    private String stringValue(Object value) {
        if (value == null) {
            return null;
        }
        String s = String.valueOf(value);
        return s == null ? null : s.trim();
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v;
            }
        }
        return null;
    }
}
