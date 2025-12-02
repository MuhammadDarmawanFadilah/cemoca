package com.shadcn.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadcn.backend.dto.NotificationRequest;
import com.shadcn.backend.dto.PagedResponse;
import com.shadcn.backend.dto.WhatsAppResponse;
import com.shadcn.backend.model.Notification;
import com.shadcn.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "${frontend.url}")
public class NotificationController {
    
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;
    
    /**
     * Send WhatsApp notification
     */
    @PostMapping(value = "/send", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<WhatsAppResponse> sendWhatsAppNotification(
            @RequestParam("title") String title,
            @RequestParam("message") String message,
            @RequestParam("recipients") String recipients,
            @RequestParam(value = "type", defaultValue = "text") String type,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        
        try {
            log.info("Received WhatsApp notification request - Title: {}, Type: {}, Recipients: {}", 
                title, type, recipients);
            
            // Parse recipients (comma-separated string)
            List<String> recipientList = Arrays.stream(recipients.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
            
            if (recipientList.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new WhatsAppResponse(false, "No valid recipients provided"));
            }
            
            // Create notification request
            NotificationRequest request = new NotificationRequest(title, message, recipientList, type);
            if (image != null && !image.isEmpty()) {
                request.setImage(image);
            }
            
            // Send notification
            WhatsAppResponse response = notificationService.sendWhatsAppNotification(request);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error in sendWhatsAppNotification: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new WhatsAppResponse(false, "Internal server error: " + e.getMessage()));
        }
    }
    
    /**
     * Send simple text message
     */
    @PostMapping("/send-text")
    public ResponseEntity<WhatsAppResponse> sendTextMessage(
            @RequestBody NotificationRequest request) {
        
        try {
            log.info("Received text notification request - Title: {}, Recipients count: {}", 
                request.getTitle(), request.getRecipients().size());
            
            if (request.getRecipients() == null || request.getRecipients().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new WhatsAppResponse(false, "No recipients provided"));
            }
            
            request.setType("text");
            WhatsAppResponse response = notificationService.sendWhatsAppNotification(request);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error in sendTextMessage: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new WhatsAppResponse(false, "Internal server error: " + e.getMessage()));
        }
    }
    
    /**
     * Get notification history with pagination
     */
    @GetMapping("/history")
    public ResponseEntity<PagedResponse<Notification>> getNotificationHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Notification> notifications;
            
            if (status != null && !status.isEmpty()) {
                try {
                    Notification.NotificationStatus notificationStatus = 
                        Notification.NotificationStatus.valueOf(status.toUpperCase());
                    notifications = notificationService.getNotificationsByStatus(notificationStatus, pageable);                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest()
                        .body(new PagedResponse<>(
                            List.of(), 
                            page, 
                            size, 
                            0L, 
                            0, 
                            page == 0, 
                            true, 
                            true));
                }
            } else {
                notifications = notificationService.getNotificationHistory(pageable);
            }
              PagedResponse<Notification> response = new PagedResponse<>(
                notifications.getContent(),
                notifications.getNumber(),
                notifications.getSize(),
                notifications.getTotalElements(),
                notifications.getTotalPages(),
                notifications.isFirst(),
                notifications.isLast(),
                notifications.isEmpty());
            
            return ResponseEntity.ok(response);
              } catch (Exception e) {
            log.error("Error getting notification history: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new PagedResponse<>(
                    List.of(), 
                    page, 
                    size, 
                    0L, 
                    0, 
                    page == 0, 
                    true, 
                    true));
        }
    }
    
    /**
     * Get notification statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getNotificationStats() {
        try {            // Get statistics from service
            Map<String, Object> stats = new HashMap<>();
            stats.put("total", notificationService.getNotificationHistory(PageRequest.of(0, 1)).getTotalElements());
            stats.put("sent", notificationService.getNotificationsByStatus(
                Notification.NotificationStatus.SENT, PageRequest.of(0, 1)).getTotalElements());
            stats.put("failed", notificationService.getNotificationsByStatus(
                Notification.NotificationStatus.FAILED, PageRequest.of(0, 1)).getTotalElements());
            stats.put("pending", notificationService.getNotificationsByStatus(
                Notification.NotificationStatus.PENDING, PageRequest.of(0, 1)).getTotalElements());
              return ResponseEntity.ok(stats);
              } catch (Exception e) {
            log.error("Error getting notification stats: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to get notification statistics");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorResponse);
        }
    }
    
    /**
     * WhatsApp specific endpoint - unified handler for all WhatsApp operations
     */
    @PostMapping(value = "/whatsapp", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<WhatsAppResponse> whatsAppEndpoint(
            @RequestParam("title") String title,
            @RequestParam("message") String message,
            @RequestParam("recipients") String recipients,
            @RequestParam(value = "type", defaultValue = "text") String type,
            @RequestParam(value = "image", required = false) MultipartFile image) {        
        try {
            log.info("WhatsApp endpoint called - Title: {}, Type: {}, Recipients: {}", 
                title, type, recipients);
                
            // Parse recipients from comma-separated string
            List<String> recipientList;
            try {
                recipientList = Arrays.stream(recipients.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
            } catch (Exception e) {
                log.error("Error parsing recipients: {}", e.getMessage());
                return ResponseEntity.badRequest()
                    .body(new WhatsAppResponse(false, "Invalid recipients format"));
            }
            
            // Validate basic requirements
            if (recipientList.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new WhatsAppResponse(false, "No recipients provided"));
            }
            
            if (message == null || message.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new WhatsAppResponse(false, "Message content is required"));
            }
            
            // Create request object
            NotificationRequest request = new NotificationRequest(title, message, recipientList, type);
            if (image != null && !image.isEmpty()) {
                request.setImage(image);
            }
            
            // Send WhatsApp notification using the service
            WhatsAppResponse response = notificationService.sendWhatsAppNotification(request);
            
            log.info("WhatsApp notification sent - Success: {}, Message: {}", 
                response.isSuccess(), response.getMessage());
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid request for WhatsApp endpoint: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(new WhatsAppResponse(false, "Invalid request: " + e.getMessage()));
                
        } catch (Exception e) {
            log.error("Error in WhatsApp endpoint: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new WhatsAppResponse(false, "Internal server error: " + e.getMessage()));
        }
    }
    
    /**
     * WhatsApp endpoint with multipart support for media messages
     */
    @PostMapping(value = "/whatsapp/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<WhatsAppResponse> whatsAppMediaEndpoint(
            @RequestParam("message") String message,
            @RequestParam("recipients") String recipients,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "type", defaultValue = "image") String type,
            @RequestParam(value = "media", required = false) MultipartFile media) {
        
        try {
            log.info("WhatsApp media endpoint called - Type: {}, Recipients: {}", type, recipients);
            
            // Parse recipients (comma-separated string)
            List<String> recipientList = Arrays.stream(recipients.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
            
            if (recipientList.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new WhatsAppResponse(false, "No valid recipients provided"));
            }
            
            // Create notification request
            NotificationRequest request = new NotificationRequest(
                title != null ? title : "Media Message", 
                message, 
                recipientList, 
                type
            );
            
            if (media != null && !media.isEmpty()) {
                request.setImage(media);
            }
            
            // Send notification
            WhatsAppResponse response = notificationService.sendWhatsAppNotification(request);
            
            log.info("WhatsApp media notification sent - Success: {}", response.isSuccess());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error in WhatsApp media endpoint: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new WhatsAppResponse(false, "Internal server error: " + e.getMessage()));
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> healthResponse = new HashMap<>();
        healthResponse.put("status", "UP");
        healthResponse.put("service", "NotificationController");
        healthResponse.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(healthResponse);
    }
    
    /**
     * Get available notification statuses
     */
    @GetMapping("/statuses")
    public ResponseEntity<List<String>> getNotificationStatuses() {
        List<String> statuses = Arrays.stream(Notification.NotificationStatus.values())
            .map(Enum::name)
            .collect(Collectors.toList());
        return ResponseEntity.ok(statuses);
    }
}
