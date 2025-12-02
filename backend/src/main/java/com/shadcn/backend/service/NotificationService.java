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
import org.springframework.core.io.FileSystemResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
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
    
    @Value("${whatsapp.api.sender}")
    private String whatsappSender;
    
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
            String endpoint;
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
              // Clean phone number (remove non-digits except +)
            String cleanRecipient = recipient.replaceAll("[^+\\d]", "");
            if (!cleanRecipient.startsWith("+")) {
                // Assume Indonesian number if no country code
                if (cleanRecipient.startsWith("0")) {
                    cleanRecipient = "+62" + cleanRecipient.substring(1);
                } else {
                    cleanRecipient = "+62" + cleanRecipient;
                }
            }
            body.add("phone", cleanRecipient);
            body.add("message", String.format("*%s*\\n\\n%s", title, message));
            
            if (imageUrl != null && !imageUrl.isEmpty()) {
                // Try sending with image first
                endpoint = "/api/send-image";
                body.add("image", imageUrl);
                body.add("caption", String.format("*%s*\\n\\n%s", title, message));
                
                // Attempt to send with image
                boolean imageSuccess = attemptSendMessage(cleanRecipient, endpoint, body);
                if (imageSuccess) {
                    return true;
                }
                
                // If image sending fails due to package limitations, fallback to text-only
                log.warn("Image sending failed for {}, falling back to text-only message", cleanRecipient);
                body = new LinkedMultiValueMap<>(); // Reset body
                body.add("phone", cleanRecipient);
                body.add("message", String.format("*%s*\\n\\n%s\\n\\n📎 Image attachment was not delivered due to package limitations.", title, message));
                endpoint = "/api/send-message";
            } else {
                endpoint = "/api/send-message";
            }            
            // Final attempt to send message (either image or fallback text)
            return attemptSendMessage(cleanRecipient, endpoint, body);
            
        } catch (Exception e) {
            log.error("Error sending message to {}: {}", recipient, e.getMessage(), e);
            return false;
        }
    }
    
    private boolean attemptSendMessage(String cleanRecipient, String endpoint, MultiValueMap<String, Object> body) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            // Add Authorization header with token as per Wablas API documentation
            headers.set("Authorization", whatsappApiToken);
            
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            String url = whatsappApiUrl + endpoint;
            log.info("Sending WhatsApp message to {} via {}", cleanRecipient, url);
            log.debug("Authorization token configured: {}", whatsappApiToken != null && !whatsappApiToken.isEmpty() ? "Yes" : "No");
            
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.POST, requestEntity, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                boolean success = responseJson.has("status") && 
                    responseJson.get("status").asBoolean();
                
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
            if (responseBody.contains("your package not support") && endpoint.contains("send-image")) {
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
