package com.shadcn.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadcn.backend.dto.NotificationRequest;
import com.shadcn.backend.dto.WhatsAppResponse;
import com.shadcn.backend.model.Notification;
import com.shadcn.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    @Value("${whatsapp.api.url}")
    private String whatsappApiUrl;
    
    @Value("${whatsapp.api.token}")
    private String whatsappApiToken;

    @Value("${whatsapp.api.secret-key:}")
    private String whatsappApiSecretKey;
    
    @Value("${app.upload.dir:/storage}")
    private String uploadDir;
    
    public WhatsAppResponse sendWhatsAppNotification(NotificationRequest request) {
        try {
            // Save notification record
            Notification notification = new Notification();
            notification.setTitle(request.getTitle());
            notification.setMessage(request.getMessage());
            notification.setRecipients(request.getRecipients());
            notification.setType("image".equals(request.getType()) ? 
                Notification.NotificationType.IMAGE : Notification.NotificationType.TEXT);
            notification.setStatus(Notification.NotificationStatus.PENDING);
            
            // Handle image upload if present
            String imageUrl = null;
            if (request.getImage() != null && !request.getImage().isEmpty()) {
                imageUrl = saveUploadedFile(request.getImage());
                notification.setImageUrl(imageUrl);
            }
            
            notification = notificationRepository.save(notification);
            
            // Send messages to WhatsApp
            List<String> successRecipients = new ArrayList<>();
            List<String> failedRecipients = new ArrayList<>();
            
            for (String recipient : request.getRecipients()) {
                try {
                    boolean sent = sendSingleMessage(recipient, request.getTitle(), request.getMessage(), imageUrl);
                    if (sent) {
                        successRecipients.add(recipient);
                    } else {
                        failedRecipients.add(recipient);
                    }
                    
                    // Small delay between messages to avoid rate limiting
                    Thread.sleep(500);
                    
                } catch (Exception e) {
                    log.error("Failed to send message to {}: {}", recipient, e.getMessage());
                    failedRecipients.add(recipient);
                }
            }
            
            // Update notification status
            if (failedRecipients.isEmpty()) {
                notification.setStatus(Notification.NotificationStatus.SENT);
                notification.setSentAt(LocalDateTime.now());
            } else {
                notification.setStatus(Notification.NotificationStatus.FAILED);
                notification.setErrorMessage(String.format("Failed to send to %d recipients", failedRecipients.size()));
            }
            
            notificationRepository.save(notification);
            
            String message = String.format("Sent to %d/%d recipients successfully", 
                successRecipients.size(), request.getRecipients().size());
            
            return new WhatsAppResponse(failedRecipients.isEmpty(), message);
            
        } catch (Exception e) {
            log.error("Error sending WhatsApp notification: {}", e.getMessage(), e);
            return new WhatsAppResponse(false, "Failed to send notification: " + e.getMessage());
        }
    }
      private boolean sendSingleMessage(String recipient, String title, String message, String imageUrl) {
        try {
            String cleanRecipient = formatPhoneForWablas(recipient);
            if (cleanRecipient == null || cleanRecipient.isBlank()) {
                log.warn("Invalid recipient phone: {}", recipient);
                return false;
            }

            String formattedText = String.format("*%s*\\n\\n%s", title, message);
            
            if (imageUrl != null && !imageUrl.isEmpty()) {
                // Try sending with image first (v2)
                boolean imageSuccess = attemptSendMessageV2(
                        cleanRecipient,
                        "/api/v2/send-image",
                        java.util.Map.of(
                                "phone", cleanRecipient,
                                "image", imageUrl,
                                "caption", formattedText
                        )
                );
                if (imageSuccess) {
                    return true;
                }
                
                // If image sending fails due to package limitations, fallback to text-only
                log.warn("Image sending failed for {}, falling back to text-only message", cleanRecipient);
                String fallbackText = String.format(
                        "*%s*\\n\\n%s\\n\\n📎 Image attachment was not delivered due to package limitations.",
                        title,
                        message
                );

                return attemptSendMessageV2(
                        cleanRecipient,
                        "/api/v2/send-message",
                        java.util.Map.of(
                                "phone", cleanRecipient,
                                "message", fallbackText
                        )
                );
            } else {
                return attemptSendMessageV2(
                        cleanRecipient,
                        "/api/v2/send-message",
                        java.util.Map.of(
                                "phone", cleanRecipient,
                                "message", formattedText
                        )
                );
            }            
            
            
        } catch (Exception e) {
            log.error("Error sending message to {}: {}", recipient, e.getMessage(), e);
            return false;
        }
    }
    
    private String authorizationHeaderValue() {
        String token = whatsappApiToken == null ? "" : whatsappApiToken.trim();
        if (token.isEmpty()) {
            return token;
        }

        if (token.contains(".")) {
            return token;
        }

        String secret = whatsappApiSecretKey == null ? "" : whatsappApiSecretKey.trim();
        if (secret.isEmpty()) {
            return token;
        }

        return token + "." + secret;
    }

    private String formatPhoneForWablas(String recipient) {
        if (recipient == null) {
            return null;
        }

        String digits = recipient.replaceAll("[^\\d]", "");
        if (digits.isBlank()) {
            return null;
        }

        if (digits.startsWith("0")) {
            digits = "62" + digits.substring(1);
        } else if (digits.startsWith("8")) {
            digits = "62" + digits;
        }

        return digits;
    }

    private boolean attemptSendMessageV2(String cleanRecipient, String endpoint, java.util.Map<String, Object> item) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", authorizationHeaderValue());

            java.util.Map<String, Object> payload = java.util.Map.of(
                    "data",
                    java.util.List.of(item)
            );

            HttpEntity<String> requestEntity = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);
            String url = whatsappApiUrl + endpoint;
            log.info("Sending WhatsApp message to {} via {}", cleanRecipient, url);
            log.debug("Authorization token configured: {}", whatsappApiToken != null && !whatsappApiToken.isEmpty() ? "Yes" : "No");
            
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.POST, requestEntity, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                boolean success = responseJson.has("status") && responseJson.get("status").asBoolean();
                
                log.info("WhatsApp API response for {}: {}", cleanRecipient, response.getBody());
                return success;
            } else {
                log.error("WhatsApp API returned status: {} for recipient: {}", 
                    response.getStatusCode(), cleanRecipient);
                return false;
            }
            
        } catch (org.springframework.web.client.HttpServerErrorException e) {
            String responseBody = e.getResponseBodyAsString();
            log.error("HTTP Server Error sending message to {}: {} - Response: {}", cleanRecipient, e.getMessage(), responseBody);
            
            // Check if this is a package limitation error for image sending
            if (responseBody != null && responseBody.contains("your package not support") && endpoint.contains("send-image")) {
                log.warn("Package does not support image messaging for recipient: {}", cleanRecipient);
                return false; // This will trigger the fallback in the calling method
            }
            
            return false;
        } catch (Exception e) {
            log.error("Error sending message to {}: {}", cleanRecipient, e.getMessage(), e);
            return false;
        }
    }
    
    private String saveUploadedFile(MultipartFile file) throws IOException {
        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".") ? 
            originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
        String filename = UUID.randomUUID().toString() + extension;
        
        // Save file
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath);
        
        // Return URL (assuming images are served from /api/images/)
        return "/api/images/" + filename;
    }
    
    public Page<Notification> getNotificationHistory(Pageable pageable) {
        return notificationRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
    
    public Page<Notification> getNotificationsByStatus(Notification.NotificationStatus status, Pageable pageable) {
        return notificationRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
    }
    
    // Simple text message sender
    public boolean sendTextMessage(String phoneNumber, String message) {
        try {
            String cleanPhone = formatPhoneForWablas(phoneNumber);
            if (cleanPhone == null || cleanPhone.isBlank()) {
                log.warn("Invalid phone number: {}", phoneNumber);
                return false;
            }
            
            return attemptSendMessageV2(
                cleanPhone,
                "/api/v2/send-message",
                java.util.Map.of(
                    "phone", cleanPhone,
                    "message", message
                )
            );
        } catch (Exception e) {
            log.error("Error sending text message to {}: {}", phoneNumber, e.getMessage(), e);
            return false;
        }
    }
    
    // Method for simple notification creation
    public Notification createNotification(Long userId, String title, String message) {
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(Notification.NotificationType.TEXT);
        notification.setStatus(Notification.NotificationStatus.PENDING);
        
        // If userId is provided, we can set recipients (assuming we have a way to get user phone)
        // For now, we'll just save the notification without recipients
        notification.setRecipients(new ArrayList<>());
        
        return notificationRepository.save(notification);
    }
}
