package com.shadcn.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class WhatsAppService {
    
    // Wablas v2 API batch size limit
    private static final int BULK_BATCH_SIZE = 100;
    
    // Retry configuration
    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final long RETRY_DELAY_MS = 2000; // 2 seconds between retries
    
    private static final Logger logger = LoggerFactory.getLogger(WhatsAppService.class);
    
    @Value("${whatsapp.api.url}")
    private String whatsappApiUrl;
    
    @Value("${whatsapp.api.token}")
    private String whatsappApiToken;
    
    @Value("${whatsapp.api.sender}")
    private String whatsappSender;
    
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    /**
     * Send invitation message via WhatsApp using Wablas API
     */
    public String sendInvitationMessage(String phoneNumber, String nama, String invitationToken) {
        try {
            String message = buildInvitationMessage(nama, invitationToken);
            return sendWhatsAppMessage(phoneNumber, message);
        } catch (Exception e) {
            logger.error("Failed to send WhatsApp invitation to {}: {}", phoneNumber, e.getMessage());
            throw new RuntimeException("Gagal mengirim undangan WhatsApp: " + e.getMessage());
        }
    }
    
    /**
     * Send general message via WhatsApp (for birthday notifications, etc.)
     */
    public String sendMessage(String phoneNumber, String message) {
        try {
            return sendWhatsAppMessage(phoneNumber, message);
        } catch (Exception e) {
            logger.error("Failed to send WhatsApp message to {}: {}", phoneNumber, e.getMessage());
            throw new RuntimeException("Gagal mengirim pesan WhatsApp: " + e.getMessage());
        }
    }
    
    /**
     * Send password reset message via WhatsApp
     */
    public boolean sendPasswordResetMessage(String phoneNumber, String resetToken, String username) {
        try {
            String message = buildPasswordResetMessage(username, resetToken);
            String messageId = sendWhatsAppMessage(phoneNumber, message);
            return messageId != null && !messageId.isEmpty();
        } catch (Exception e) {
            logger.error("Failed to send password reset WhatsApp message to {}: {}", phoneNumber, e.getMessage());
            return false;
        }
    }
    
    /**
     * Build invitation message content
     */
    private String buildInvitationMessage(String nama, String invitationToken) {
        String registrationUrl = frontendUrl + "/register/invitation?token=" + invitationToken;
        
        return String.format(
            "*🎓 Undangan Cemoca 🎓*\n\n" +
            "Halo %s!\n\n" +
            "Anda telah diundang untuk bergabung dengan sistem Cemoca.\n\n" +
            "📱 Klik link berikut untuk mendaftar:\n" +
            "%s\n\n" +
            "✨ Dengan bergabung, Anda dapat:\n" +
            "• Terhubung dengan sesama member\n" +
            "• Mendapat informasi terbaru\n" +
            "• Berbagi pengalaman dan prestasi\n" +
            "• Akses ke database member\n\n" +
            "⏰ Link ini berlaku selama 7 hari.\n\n" +
            "Terima kasih! 🙏",
            nama, registrationUrl
        );
    }
    
    /**
     * Build password reset message content
     */
    private String buildPasswordResetMessage(String username, String resetToken) {
        String resetUrl = frontendUrl + "/forgot-password-reset?token=" + resetToken;
        
        return String.format(
            "🔐 *Reset Password - Alumni Portal*\n\n" +
            "Halo %s,\n\n" +
            "Anda telah meminta untuk mereset password akun Alumni Portal Anda.\n\n" +
            "🔗 Klik link berikut untuk mereset password:\n" +
            "%s\n\n" +
            "⚠️ *Penting:*\n" +
            "• Link ini berlaku selama 1 jam\n" +
            "• Jangan bagikan link ini kepada siapapun\n" +
            "• Jika Anda tidak meminta reset password, abaikan pesan ini\n\n" +
            "Terima kasih,\n" +
            "Tim Alumni Portal",
            username, resetUrl
        );
    }
    
    /**
     * Send WhatsApp message using Wablas API - returns detailed result
     * Returns Map with: success (boolean), messageId (String), status (String), error (String), rawResponse (String)
     * Reference: https://tegal.wablas.com/documentation/api
     */
    public Map<String, Object> sendMessageWithDetails(String phoneNumber, String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("phone", phoneNumber);
        
        try {
            // Clean and format phone number for WhatsApp (62xxx format, no + symbol)
            String cleanPhone = formatPhoneNumberForWhatsApp(phoneNumber);
            result.put("formattedPhone", cleanPhone);
            
            // Validate phone number format
            if (cleanPhone == null || cleanPhone.length() < 10) {
                result.put("error", "Invalid phone number format: " + phoneNumber);
                logger.error("[WABLAS] Invalid phone: {}", phoneNumber);
                return result;
            }
            
            // Prepare request body for Wablas API (form-urlencoded)
            // Reference: https://tegal.wablas.com/documentation/api - POST /api/send-message
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("phone", cleanPhone);
            body.add("message", message);
            
            // Set headers with authorization token
            // IMPORTANT: Wablas v1 API requires APPLICATION_FORM_URLENCODED, not MULTIPART_FORM_DATA
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("Authorization", whatsappApiToken);
            
            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);
            String url = whatsappApiUrl + "/api/send-message";
            
            logger.info("[WABLAS] Sending message to {} via {}", cleanPhone, url);
            logger.debug("[WABLAS] Message length: {} chars", message.length());
            
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.POST, requestEntity, String.class);
            
            result.put("httpStatus", response.getStatusCode().value());
            result.put("rawResponse", response.getBody());
            
            logger.info("[WABLAS] Response for {}: {}", cleanPhone, response.getBody());
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                
                // Check status field - Wablas returns status: true/false
                boolean apiSuccess = responseJson.has("status") && responseJson.get("status").asBoolean();
                
                if (apiSuccess) {
                    result.put("success", true);
                    
                    // Extract quota info
                    if (responseJson.has("data") && responseJson.get("data").has("quota")) {
                        result.put("quota", responseJson.get("data").get("quota").asInt());
                    }
                    
                    // Extract message details from data.messages[0]
                    if (responseJson.has("data") && responseJson.get("data").has("messages")) {
                        JsonNode messages = responseJson.get("data").get("messages");
                        if (messages.isArray() && messages.size() > 0) {
                            JsonNode firstMessage = messages.get(0);
                            
                            if (firstMessage.has("id")) {
                                result.put("messageId", firstMessage.get("id").asText());
                            }
                            if (firstMessage.has("status")) {
                                String msgStatus = firstMessage.get("status").asText();
                                result.put("messageStatus", msgStatus);
                                
                                // "pending" is normal - it means message is queued for delivery
                                // Only mark as failed if explicitly failed
                                if ("failed".equalsIgnoreCase(msgStatus) || 
                                    "error".equalsIgnoreCase(msgStatus) ||
                                    "rejected".equalsIgnoreCase(msgStatus) ||
                                    "cancel".equalsIgnoreCase(msgStatus)) {
                                    result.put("success", false);
                                    result.put("error", "Message status: " + msgStatus);
                                }
                            }
                            if (firstMessage.has("message")) {
                                String msgDetail = firstMessage.get("message").asText();
                                result.put("messageDetail", msgDetail);
                                
                                // Check for specific error messages
                                if (msgDetail != null && (
                                    msgDetail.toLowerCase().contains("not registered") ||
                                    msgDetail.toLowerCase().contains("tidak terdaftar") ||
                                    msgDetail.toLowerCase().contains("invalid") ||
                                    msgDetail.toLowerCase().contains("blocked"))) {
                                    result.put("success", false);
                                    result.put("error", msgDetail);
                                }
                            }
                        }
                    }
                    
                    // Generate fallback messageId if not found
                    if (!result.containsKey("messageId")) {
                        result.put("messageId", "WA_" + System.currentTimeMillis());
                    }
                    
                    logger.info("[WABLAS] SUCCESS - Phone: {}, MessageId: {}, Status: {}", 
                        cleanPhone, result.get("messageId"), result.get("messageStatus"));
                    
                } else {
                    // API returned status: false
                    String errorMsg = "Unknown error";
                    if (responseJson.has("message")) {
                        errorMsg = responseJson.get("message").asText();
                    } else if (responseJson.has("data") && responseJson.get("data").has("message")) {
                        errorMsg = responseJson.get("data").get("message").asText();
                    }
                    result.put("error", errorMsg);
                    logger.error("[WABLAS] FAILED - Phone: {}, Error: {}", cleanPhone, errorMsg);
                }
            } else {
                result.put("error", "HTTP " + response.getStatusCode());
                logger.error("[WABLAS] FAILED - Phone: {}, HTTP Status: {}", cleanPhone, response.getStatusCode());
            }
            
        } catch (Exception e) {
            result.put("error", e.getMessage());
            logger.error("[WABLAS] EXCEPTION - Phone: {}, Error: {}", phoneNumber, e.getMessage(), e);
        }
        
        return result;
    }
    
    /**
     * Send WhatsApp message using Wablas API (same as NotificationService)
     * Reference: https://tegal.wablas.com/documentation/api
     */
    private String sendWhatsAppMessage(String phoneNumber, String message) {
        try {
            // Clean and format phone number for WhatsApp (62xxx format, no + symbol)
            String cleanPhone = formatPhoneNumberForWhatsApp(phoneNumber);
            
            // Validate phone number
            if (cleanPhone == null || cleanPhone.length() < 10) {
                throw new RuntimeException("Invalid phone number format: " + phoneNumber);
            }
            
            // Prepare request body for Wablas API
            // Reference: https://tegal.wablas.com/documentation/api - POST /api/send-message
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("phone", cleanPhone);
            body.add("message", message);
            
            // Set headers with authorization token
            // IMPORTANT: Wablas v1 API requires APPLICATION_FORM_URLENCODED, not MULTIPART_FORM_DATA
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("Authorization", whatsappApiToken);
            
            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);
            String url = whatsappApiUrl + "/api/send-message";
            
            logger.info("[WABLAS] Sending message to {} via {}", cleanPhone, url);
            logger.debug("[WABLAS] Authorization token configured: {}", whatsappApiToken != null && !whatsappApiToken.isEmpty() ? "Yes" : "No");
            
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.POST, requestEntity, String.class);
            
            logger.info("[WABLAS] Raw response status: {}", response.getStatusCode());
            logger.info("[WABLAS] Raw response body: {}", response.getBody());
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                
                // Check status field - Wablas returns status: true/false
                boolean success = responseJson.has("status") && 
                    responseJson.get("status").asBoolean();
                
                if (success) {
                    // Extract message ID from response structure: data.messages[0].id
                    String messageId = "WA_" + System.currentTimeMillis(); // fallback
                    String messageStatus = "unknown";
                    
                    try {
                        if (responseJson.has("data") && responseJson.get("data").has("messages")) {
                            JsonNode messages = responseJson.get("data").get("messages");
                            if (messages.isArray() && messages.size() > 0) {
                                JsonNode firstMessage = messages.get(0);
                                
                                // Get message ID
                                if (firstMessage.has("id")) {
                                    String extractedId = firstMessage.get("id").asText();
                                    if (extractedId != null && !extractedId.isEmpty()) {
                                        messageId = extractedId;
                                    }
                                }
                                
                                // Get message status (sent, pending, failed, etc.)
                                if (firstMessage.has("status")) {
                                    messageStatus = firstMessage.get("status").asText();
                                }
                                
                                // Check for Wablas specific error messages
                                if (firstMessage.has("message")) {
                                    String wablasMessage = firstMessage.get("message").asText();
                                    logger.info("[WABLAS] Message detail: {}", wablasMessage);
                                    
                                    // Check for common errors
                                    if (wablasMessage != null && (
                                        wablasMessage.toLowerCase().contains("not registered") ||
                                        wablasMessage.toLowerCase().contains("invalid") ||
                                        wablasMessage.toLowerCase().contains("tidak terdaftar"))) {
                                        throw new RuntimeException("WhatsApp error: " + wablasMessage);
                                    }
                                }
                                
                                logger.info("[WABLAS] SUCCESS - MessageId: {}, Status: {}, Phone: {}", messageId, messageStatus, cleanPhone);
                            } else {
                                logger.warn("[WABLAS] Messages array is empty or not an array");
                            }
                        } else {
                            logger.warn("[WABLAS] No 'data.messages' found in response");
                        }
                    } catch (RuntimeException re) {
                        throw re; // Re-throw our own exceptions
                    } catch (Exception e) {
                        logger.error("[WABLAS] Error parsing response: {}", e.getMessage());
                    }
                    
                    return messageId;
                } else {
                    // API returned status: false
                    String errorMsg = "Unknown error";
                    if (responseJson.has("message")) {
                        errorMsg = responseJson.get("message").asText();
                    } else if (responseJson.has("data") && responseJson.get("data").has("message")) {
                        errorMsg = responseJson.get("data").get("message").asText();
                    }
                    logger.error("[WABLAS] FAILED - Status false, Error: {}, Phone: {}", errorMsg, cleanPhone);
                    throw new RuntimeException("WhatsApp API error: " + errorMsg);
                }
            } else {
                logger.error("[WABLAS] FAILED - HTTP status: {} for phone: {}", response.getStatusCode(), cleanPhone);
                throw new RuntimeException("WhatsApp API error: HTTP " + response.getStatusCode());
            }
            
        } catch (RuntimeException re) {
            throw re; // Re-throw runtime exceptions as-is
        } catch (Exception e) {
            logger.error("[WABLAS] EXCEPTION sending to {}: {}", phoneNumber, e.getMessage(), e);
            throw new RuntimeException("WhatsApp API error: " + e.getMessage());
        }
    }
    
    /**
     * Check if WhatsApp service is available
     */
    public boolean isWhatsAppServiceAvailable() {
        if (whatsappApiUrl != null && !whatsappApiUrl.isEmpty() && 
            whatsappApiToken != null && !whatsappApiToken.isEmpty()) {
            try {
                // Simple ping test to check if API is reachable
                HttpHeaders headers = new HttpHeaders();
                headers.set("Authorization", whatsappApiToken);
                
                HttpEntity<String> entity = new HttpEntity<>(headers);
                ResponseEntity<String> response = restTemplate.exchange(
                    whatsappApiUrl + "/api/device-status", 
                    HttpMethod.GET, 
                    entity, 
                    String.class
                );
                
                return response.getStatusCode() == HttpStatus.OK;
            } catch (Exception e) {
                logger.warn("WhatsApp API health check failed: {}", e.getMessage());
                return false;
            }
        }
        
        logger.warn("WhatsApp API not configured properly");
        return false;
    }
    
    /**
     * Get device status from Wablas
     */
    public Map<String, Object> getDeviceStatus() {
        Map<String, Object> result = new HashMap<>();
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", whatsappApiToken);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(
                whatsappApiUrl + "/api/device-status", 
                HttpMethod.GET, 
                entity, 
                String.class
            );
            
            logger.info("[WABLAS] Device status response: {}", response.getBody());
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                result.put("success", true);
                result.put("response", response.getBody());
                
                if (responseJson.has("data")) {
                    JsonNode data = responseJson.get("data");
                    if (data.has("status")) {
                        result.put("deviceStatus", data.get("status").asText());
                    }
                    if (data.has("quota")) {
                        result.put("quota", data.get("quota").asInt());
                    }
                }
            } else {
                result.put("success", false);
                result.put("error", "HTTP " + response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("[WABLAS] Error getting device status: {}", e.getMessage());
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return result;
    }
    
    /**
     * Check if phone number is registered on WhatsApp using Wablas validate API
     */
    public Map<String, Object> validatePhoneNumber(String phoneNumber) {
        Map<String, Object> result = new HashMap<>();
        try {
            String cleanPhone = formatPhoneNumberForWhatsApp(phoneNumber);
            
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("phone", cleanPhone);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("Authorization", whatsappApiToken);
            
            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);
            String url = whatsappApiUrl + "/api/check-number";
            
            logger.info("[WABLAS] Validating phone number: {}", cleanPhone);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.POST, requestEntity, String.class);
            
            logger.info("[WABLAS] Validate response: {}", response.getBody());
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                result.put("success", true);
                result.put("response", response.getBody());
                
                if (responseJson.has("status")) {
                    result.put("registered", responseJson.get("status").asBoolean());
                }
                if (responseJson.has("data") && responseJson.get("data").has("status")) {
                    result.put("registered", responseJson.get("data").get("status").asBoolean());
                }
            } else {
                result.put("success", false);
                result.put("error", "HTTP " + response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("[WABLAS] Error validating phone: {}", e.getMessage());
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return result;
    }
    
    /**
     * Get message report/status by message ID from Wablas API
     * https://tegal.wablas.com/api/report/message?message_id={id}
     */
    public Map<String, Object> getMessageStatus(String messageId) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("messageId", messageId);
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", whatsappApiToken);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            String url = whatsappApiUrl + "/api/report/message?message_id=" + messageId;
            
            logger.info("[WABLAS] Getting message status for ID: {}", messageId);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, String.class);
            
            result.put("httpStatus", response.getStatusCode().value());
            result.put("rawResponse", response.getBody());
            
            logger.info("[WABLAS] Message status response: {}", response.getBody());
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                
                boolean apiSuccess = responseJson.has("status") && responseJson.get("status").asBoolean();
                
                if (apiSuccess) {
                    result.put("success", true);
                    
                    // Extract message details from response
                    // Structure: { status: true, message: [...], totalData, perPage, page, totalPage }
                    if (responseJson.has("message") && responseJson.get("message").isArray()) {
                        JsonNode messages = responseJson.get("message");
                        if (messages.size() > 0) {
                            JsonNode msg = messages.get(0);
                            
                            if (msg.has("status")) {
                                String status = msg.get("status").asText();
                                result.put("status", status);
                                // Status values: pending, sent, delivered, read, cancel, rejected, failed
                            }
                            if (msg.has("text")) {
                                result.put("text", msg.get("text").asText());
                            }
                            if (msg.has("phone")) {
                                if (msg.get("phone").has("to")) {
                                    result.put("phoneTo", msg.get("phone").get("to").asText());
                                }
                                if (msg.get("phone").has("from")) {
                                    result.put("phoneFrom", msg.get("phone").get("from").asText());
                                }
                            }
                            if (msg.has("category")) {
                                result.put("category", msg.get("category").asText());
                            }
                            if (msg.has("date")) {
                                if (msg.get("date").has("created_at")) {
                                    result.put("createdAt", msg.get("date").get("created_at").asText());
                                }
                                if (msg.get("date").has("updated_at")) {
                                    result.put("updatedAt", msg.get("date").get("updated_at").asText());
                                }
                            }
                            
                            logger.info("[WABLAS] Message {} status: {}", messageId, result.get("status"));
                        } else {
                            result.put("error", "Message not found in response");
                        }
                    } else if (responseJson.has("message") && responseJson.get("message").isTextual()) {
                        // Sometimes message can be a string error message
                        result.put("error", responseJson.get("message").asText());
                        result.put("success", false);
                    }
                } else {
                    String errorMsg = "Unknown error";
                    if (responseJson.has("message")) {
                        errorMsg = responseJson.get("message").asText();
                    }
                    result.put("error", errorMsg);
                    logger.error("[WABLAS] Get message status failed: {}", errorMsg);
                }
            } else {
                result.put("error", "HTTP " + response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("[WABLAS] Exception getting message status: {}", e.getMessage());
            result.put("error", e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Check phone number registration on WhatsApp
     * GET https://phone.wablas.com/check-phone-number?phones={phones}
     * Reference: https://tegal.wablas.com/documentation/api
     */
    public Map<String, Object> checkPhoneRegistration(String phoneNumber) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("phone", phoneNumber);
        
        try {
            // Format without + symbol (just 62xxx)
            String cleanPhone = formatPhoneNumberForWhatsApp(phoneNumber);
            result.put("formattedPhone", cleanPhone);
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", whatsappApiToken);
            headers.set("url", whatsappApiUrl);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            String url = "https://phone.wablas.com/check-phone-number?phones=" + cleanPhone;
            
            logger.info("[WABLAS] Checking phone registration: {}", cleanPhone);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, String.class);
            
            result.put("httpStatus", response.getStatusCode().value());
            result.put("rawResponse", response.getBody());
            
            logger.info("[WABLAS] Phone check response: {}", response.getBody());
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                
                String status = responseJson.has("status") ? responseJson.get("status").asText() : null;
                if ("success".equalsIgnoreCase(status)) {
                    result.put("success", true);
                    
                    // Structure: { status: "success", data: [{ phone, status: "online/offline" }], message }
                    if (responseJson.has("data") && responseJson.get("data").isArray()) {
                        JsonNode data = responseJson.get("data");
                        if (data.size() > 0) {
                            JsonNode phoneData = data.get(0);
                            if (phoneData.has("status")) {
                                String phoneStatus = phoneData.get("status").asText();
                                result.put("registrationStatus", phoneStatus);
                                // "online" means registered on WhatsApp, "offline" means not registered
                                result.put("isRegistered", "online".equalsIgnoreCase(phoneStatus));
                            }
                        }
                    }
                } else {
                    result.put("error", responseJson.has("message") ? responseJson.get("message").asText() : "Unknown error");
                }
            } else {
                result.put("error", "HTTP " + response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("[WABLAS] Exception checking phone: {}", e.getMessage());
            result.put("error", e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Format phone number for WhatsApp messaging via Wablas API
     * Wablas accepts: 62xxx format (NO + symbol needed)
     * Reference: https://tegal.wablas.com/documentation/api
     */
    public String formatPhoneNumberForWhatsApp(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            return phoneNumber;
        }
        
        // Clean phone number (remove all non-digits)
        String cleaned = phoneNumber.replaceAll("[^\\d]", "");
        
        // Log original and cleaned for debugging
        logger.debug("[WABLAS] Phone formatting - Original: {}, Cleaned: {}", phoneNumber, cleaned);
        
        String result;
        
        if (cleaned.startsWith("62")) {
            // Already has 62 prefix - use as is
            result = cleaned;
        } else if (cleaned.startsWith("0")) {
            // Local Indonesian format (08xxx) - convert to 62xxx
            result = "62" + cleaned.substring(1);
        } else if (cleaned.length() >= 9 && cleaned.length() <= 13) {
            // Assume Indonesian number without prefix - add 62
            result = "62" + cleaned;
        } else {
            // Use as-is for other formats
            result = cleaned;
        }
        
        logger.info("[WABLAS] Phone formatted: {} -> {}", phoneNumber, result);
        return result;
    }
    
    /**
     * Format phone number for storage (keep as 08xxx format)
     */
    public String formatPhoneNumber(String phoneNumber) {
        // Clean phone number (remove non-digits)
        String cleaned = phoneNumber.replaceAll("[^\\d]", "");
        
        // Convert +62 or 62 to 08 format
        if (cleaned.startsWith("62")) {
            cleaned = "0" + cleaned.substring(2);
        } else if (!cleaned.startsWith("0")) {
            cleaned = "0" + cleaned;
        }
        
        return cleaned;
    }
    
    /**
     * Public method to expose phone formatting for debug endpoint
     * Returns the formatted phone number as Wablas API expects (62xxx without + symbol)
     */
    public String formatPhoneForDebug(String phoneNumber) {
        return formatPhoneNumberForWhatsApp(phoneNumber);
    }
    
    // ===============================================
    // BULK MESSAGING - Wablas v2 API
    // Supports up to 100 messages per batch
    // Reference: https://tegal.wablas.com/documentation/api
    // ===============================================
    
    /**
     * DTO for bulk message item
     */
    public static class BulkMessageItem {
        private String phone;
        private String message;
        private String originalId; // to track which item this belongs to
        
        public BulkMessageItem(String phone, String message, String originalId) {
            this.phone = phone;
            this.message = message;
            this.originalId = originalId;
        }
        
        public String getPhone() { return phone; }
        public String getMessage() { return message; }
        public String getOriginalId() { return originalId; }
    }
    
    /**
     * DTO for bulk message result
     */
    public static class BulkMessageResult {
        private String originalId;
        private String phone;
        private String messageId;
        private boolean success;
        private String status;
        private String error;
        
        public String getOriginalId() { return originalId; }
        public void setOriginalId(String originalId) { this.originalId = originalId; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getMessageId() { return messageId; }
        public void setMessageId(String messageId) { this.messageId = messageId; }
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
    
    /**
     * Send bulk messages using Wablas v2 API with retry support
     * Supports up to 100 messages per batch (API limit)
     * Automatically splits larger batches into multiple requests
     * 
     * v2 API format: POST /api/v2/send-message
     * Body: { "data": [ { "phone": "62xxx", "message": "text" }, ... ] }
     * Optional: "retry": true, "priority": true
     * 
     * Reference: https://tegal.wablas.com/documentation/api
     */
    public List<BulkMessageResult> sendBulkMessages(List<BulkMessageItem> items) {
        return sendBulkMessagesWithRetry(items, MAX_RETRY_ATTEMPTS);
    }
    
    /**
     * Send bulk messages with configurable retry attempts
     */
    public List<BulkMessageResult> sendBulkMessagesWithRetry(List<BulkMessageItem> items, int maxRetries) {
        List<BulkMessageResult> allResults = new ArrayList<>();
        
        if (items == null || items.isEmpty()) {
            logger.warn("[WABLAS-BULK] No items to send");
            return allResults;
        }
        
        logger.info("[WABLAS-BULK] ========================================");
        logger.info("[WABLAS-BULK] Starting bulk send for {} items", items.size());
        logger.info("[WABLAS-BULK] Batch size: {}, Max retries: {}", BULK_BATCH_SIZE, maxRetries);
        logger.info("[WABLAS-BULK] ========================================");
        
        // Split into batches of 100 (max per Wablas v2 API request)
        List<List<BulkMessageItem>> batches = splitIntoBatches(items, BULK_BATCH_SIZE);
        int batchNumber = 0;
        
        for (List<BulkMessageItem> batch : batches) {
            batchNumber++;
            logger.info("[WABLAS-BULK] Processing batch {}/{} ({} items)", batchNumber, batches.size(), batch.size());
            
            List<BulkMessageResult> batchResults = sendBatchWithRetry(batch, maxRetries, batchNumber, batches.size());
            allResults.addAll(batchResults);
            
            // Count success/fail
            long successCount = batchResults.stream().filter(BulkMessageResult::isSuccess).count();
            logger.info("[WABLAS-BULK] Batch {}/{} complete - Success: {}, Failed: {}", 
                batchNumber, batches.size(), successCount, batch.size() - successCount);
            
            // Small delay between batches to avoid rate limiting
            if (batchNumber < batches.size()) {
                try {
                    Thread.sleep(500); // 500ms between batches
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    logger.error("[WABLAS-BULK] Interrupted at batch {}", batchNumber);
                    break;
                }
            }
        }
        
        // Summary
        long totalSuccess = allResults.stream().filter(BulkMessageResult::isSuccess).count();
        logger.info("[WABLAS-BULK] ========================================");
        logger.info("[WABLAS-BULK] COMPLETE - Total: {}, Success: {}, Failed: {}", 
            allResults.size(), totalSuccess, allResults.size() - totalSuccess);
        logger.info("[WABLAS-BULK] ========================================");
        
        return allResults;
    }
    
    /**
     * Send a batch with retry logic
     */
    private List<BulkMessageResult> sendBatchWithRetry(List<BulkMessageItem> batch, int maxRetries, int batchNum, int totalBatches) {
        List<BulkMessageResult> results = new ArrayList<>();
        List<BulkMessageItem> itemsToRetry = new ArrayList<>(batch);
        
        for (int attempt = 1; attempt <= maxRetries && !itemsToRetry.isEmpty(); attempt++) {
            logger.info("[WABLAS-BULK] Batch {}/{} - Attempt {}/{} ({} items)", 
                batchNum, totalBatches, attempt, maxRetries, itemsToRetry.size());
            
            try {
                List<BulkMessageResult> attemptResults = sendBulkBatch(itemsToRetry);
                
                // Separate successful and failed results
                List<BulkMessageItem> stillFailed = new ArrayList<>();
                
                for (BulkMessageResult result : attemptResults) {
                    if (result.isSuccess()) {
                        results.add(result);
                    } else {
                        // Check if error is retryable
                        if (isRetryableError(result.getError()) && attempt < maxRetries) {
                            // Find original item for retry
                            BulkMessageItem originalItem = findItemByOriginalId(itemsToRetry, result.getOriginalId());
                            if (originalItem != null) {
                                stillFailed.add(originalItem);
                                logger.debug("[WABLAS-BULK] Will retry item {} - Error: {}", result.getOriginalId(), result.getError());
                            } else {
                                results.add(result); // Can't find item, add as failed
                            }
                        } else {
                            results.add(result); // Non-retryable or max retries reached
                        }
                    }
                }
                
                itemsToRetry = stillFailed;
                
                if (!itemsToRetry.isEmpty() && attempt < maxRetries) {
                    logger.info("[WABLAS-BULK] {} items need retry, waiting {}ms...", itemsToRetry.size(), RETRY_DELAY_MS);
                    Thread.sleep(RETRY_DELAY_MS);
                }
                
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                logger.error("[WABLAS-BULK] Interrupted during retry");
                
                // Mark remaining as failed
                for (BulkMessageItem item : itemsToRetry) {
                    BulkMessageResult failResult = new BulkMessageResult();
                    failResult.setOriginalId(item.getOriginalId());
                    failResult.setPhone(item.getPhone());
                    failResult.setSuccess(false);
                    failResult.setError("Interrupted during retry");
                    results.add(failResult);
                }
                break;
                
            } catch (Exception e) {
                logger.error("[WABLAS-BULK] Error in attempt {}: {}", attempt, e.getMessage());
                
                if (attempt == maxRetries) {
                    // Mark remaining as failed on last attempt
                    for (BulkMessageItem item : itemsToRetry) {
                        BulkMessageResult failResult = new BulkMessageResult();
                        failResult.setOriginalId(item.getOriginalId());
                        failResult.setPhone(item.getPhone());
                        failResult.setSuccess(false);
                        failResult.setError("Failed after " + maxRetries + " attempts: " + e.getMessage());
                        results.add(failResult);
                    }
                }
            }
        }
        
        return results;
    }
    
    /**
     * Check if error is retryable
     */
    private boolean isRetryableError(String error) {
        if (error == null) return true;
        
        String lowerError = error.toLowerCase();
        
        // Non-retryable errors
        if (lowerError.contains("not registered") ||
            lowerError.contains("tidak terdaftar") ||
            lowerError.contains("invalid phone") ||
            lowerError.contains("blocked") ||
            lowerError.contains("rejected")) {
            return false;
        }
        
        // Retryable errors (network issues, rate limits, etc.)
        return true;
    }
    
    /**
     * Find item by originalId in list
     */
    private BulkMessageItem findItemByOriginalId(List<BulkMessageItem> items, String originalId) {
        if (originalId == null) return null;
        return items.stream()
            .filter(item -> originalId.equals(item.getOriginalId()))
            .findFirst()
            .orElse(null);
    }
    
    /**
     * Send a single batch of messages using Wablas v2 API
     */
    private List<BulkMessageResult> sendBulkBatch(List<BulkMessageItem> batch) {
        List<BulkMessageResult> results = new ArrayList<>();
        
        try {
            // Build request body for v2 API
            List<Map<String, String>> dataArray = new ArrayList<>();
            List<BulkMessageItem> validItems = new ArrayList<>(); // Use index-based tracking for same-phone items
            
            for (BulkMessageItem item : batch) {
                String formattedPhone = formatPhoneNumberForWhatsApp(item.getPhone());
                
                if (formattedPhone == null || formattedPhone.length() < 10) {
                    // Invalid phone - skip but record as failed
                    BulkMessageResult failResult = new BulkMessageResult();
                    failResult.setOriginalId(item.getOriginalId());
                    failResult.setPhone(item.getPhone());
                    failResult.setSuccess(false);
                    failResult.setError("Invalid phone number format");
                    results.add(failResult);
                    continue;
                }
                
                Map<String, String> msgData = new HashMap<>();
                msgData.put("phone", formattedPhone);
                msgData.put("message", item.getMessage());
                dataArray.add(msgData);
                validItems.add(item); // Track by index, not phone (handles same phone multiple times)
            }
            
            if (dataArray.isEmpty()) {
                logger.warn("[WABLAS-BULK] No valid phones in batch");
                return results;
            }
            
            // Build v2 API request
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("data", dataArray);
            requestBody.put("retry", true); // Enable retry for failed messages
            requestBody.put("priority", false); // Don't use priority for bulk
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", whatsappApiToken);
            
            String url = whatsappApiUrl + "/api/v2/send-message";
            
            logger.info("[WABLAS-BULK] Sending {} messages to v2 API", dataArray.size());
            
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.POST, requestEntity, String.class);
            
            logger.info("[WABLAS-BULK] v2 API Response: {}", response.getBody());
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                boolean apiSuccess = responseJson.has("status") && responseJson.get("status").asBoolean();
                
                if (apiSuccess && responseJson.has("data") && responseJson.get("data").has("messages")) {
                    JsonNode messages = responseJson.get("data").get("messages");
                    
                    if (messages.isArray()) {
                        // Response messages are in same order as request - use index-based mapping
                        int msgIndex = 0;
                        for (JsonNode msgNode : messages) {
                            String phone = msgNode.has("phone") ? msgNode.get("phone").asText() : "";
                            String messageId = msgNode.has("id") ? msgNode.get("id").asText() : "";
                            String status = msgNode.has("status") ? msgNode.get("status").asText() : "unknown";
                            String detail = msgNode.has("message") ? msgNode.get("message").asText() : "";
                            
                            // Get original item by index (not phone, since same phone can appear multiple times)
                            BulkMessageItem originalItem = msgIndex < validItems.size() ? validItems.get(msgIndex) : null;
                            BulkMessageResult result = new BulkMessageResult();
                            result.setPhone(phone);
                            result.setMessageId(messageId);
                            result.setStatus(status);
                            result.setOriginalId(originalItem != null ? originalItem.getOriginalId() : null);
                            
                            // Determine success based on status
                            if ("failed".equalsIgnoreCase(status) || 
                                "error".equalsIgnoreCase(status) ||
                                "rejected".equalsIgnoreCase(status) ||
                                "cancel".equalsIgnoreCase(status) ||
                                (detail != null && detail.toLowerCase().contains("not registered"))) {
                                result.setSuccess(false);
                                result.setError(detail != null && !detail.isEmpty() ? detail : "Status: " + status);
                            } else {
                                result.setSuccess(true);
                            }
                            
                            results.add(result);
                            msgIndex++; // Move to next item
                        }
                    }
                    
                    // Handle any items not covered by API response (shouldn't happen normally)
                    for (int i = results.size(); i < validItems.size(); i++) {
                        BulkMessageItem item = validItems.get(i);
                        BulkMessageResult unknownResult = new BulkMessageResult();
                        unknownResult.setOriginalId(item.getOriginalId());
                        unknownResult.setPhone(item.getPhone());
                        unknownResult.setSuccess(false);
                        unknownResult.setError("No response from API for this item");
                        results.add(unknownResult);
                    }
                } else {
                    // API returned error
                    String errorMsg = responseJson.has("message") ? responseJson.get("message").asText() : "Unknown error";
                    logger.error("[WABLAS-BULK] API error: {}", errorMsg);
                    
                    // Mark all as failed
                    for (BulkMessageItem item : validItems) {
                        BulkMessageResult failResult = new BulkMessageResult();
                        failResult.setOriginalId(item.getOriginalId());
                        failResult.setPhone(item.getPhone());
                        failResult.setSuccess(false);
                        failResult.setError("API error: " + errorMsg);
                        results.add(failResult);
                    }
                }
            } else {
                logger.error("[WABLAS-BULK] HTTP error: {}", response.getStatusCode());
                
                // Mark all as failed
                for (BulkMessageItem item : validItems) {
                    BulkMessageResult failResult = new BulkMessageResult();
                    failResult.setOriginalId(item.getOriginalId());
                    failResult.setPhone(item.getPhone());
                    failResult.setSuccess(false);
                    failResult.setError("HTTP " + response.getStatusCode());
                    results.add(failResult);
                }
            }
            
        } catch (Exception e) {
            logger.error("[WABLAS-BULK] Exception in batch: {}", e.getMessage(), e);
            throw new RuntimeException("Bulk send error: " + e.getMessage(), e);
        }
        
        return results;
    }
    
    /**
     * Split list into batches of specified size
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
     * Set device speed/delay for Wablas
     * Delay: 10-120 seconds (per 5 messages)
     * Reference: POST /api/device/speed { "delay": 10 }
     */
    public Map<String, Object> setDeviceSpeed(int delaySeconds) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        
        try {
            // Validate delay range (10-120 seconds)
            int safeDelay = Math.max(10, Math.min(120, delaySeconds));
            
            Map<String, Object> body = new HashMap<>();
            body.put("delay", safeDelay);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", whatsappApiToken);
            
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            String url = whatsappApiUrl + "/api/device/speed";
            
            logger.info("[WABLAS] Setting device speed delay to {} seconds", safeDelay);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.POST, requestEntity, String.class);
            
            logger.info("[WABLAS] Device speed response: {}", response.getBody());
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                if (responseJson.has("status") && responseJson.get("status").asBoolean()) {
                    result.put("success", true);
                    result.put("delay", safeDelay);
                } else {
                    result.put("error", responseJson.has("message") ? responseJson.get("message").asText() : "Unknown error");
                }
            } else {
                result.put("error", "HTTP " + response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("[WABLAS] Error setting device speed: {}", e.getMessage());
            result.put("error", e.getMessage());
        }
        
        return result;
    }
}
