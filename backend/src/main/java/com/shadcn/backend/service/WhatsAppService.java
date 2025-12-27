package com.shadcn.backend.service;

import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;

@Service
public class WhatsAppService {

    @Value("${whatsapp.api.max-media-bytes}")
    private long wablasMaxMediaBytes;

    @Value("${whatsapp.wablas.max-media-bytes}")
    private long wablasProviderMaxMediaBytes;

    @SuppressWarnings("unused")
    @PostConstruct
    private void validateWablasMaxMediaBytes() {
        // Touch optional injected fields to avoid false-positive "unused" warnings
        String sender = whatsappSender;
        if (sender != null && sender.isBlank()) {
            // no-op
        }

        if (wablasMaxMediaBytes <= 0) {
            throw new IllegalStateException("whatsapp.api.max-media-bytes must be > 0");
        }

        if (wablasProviderMaxMediaBytes <= 0) {
            throw new IllegalStateException("whatsapp.wablas.max-media-bytes must be > 0");
        }
    }
    
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
    
    @Value("${whatsapp.api.secret-key:}")
    private String whatsappApiSecretKey;

    @Value("${whatsapp.wablas.timezone:Asia/Jakarta}")
    private String wablasTimezone;
    
    @Value("${whatsapp.api.sender}")
    @SuppressWarnings("unused")
    private String whatsappSender;
    
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private ObjectMapper objectMapper;

    private boolean isWablasSuccess(JsonNode responseJson) {
        if (responseJson == null || !responseJson.has("status")) {
            return false;
        }

        JsonNode st = responseJson.get("status");
        if (st == null || st.isNull()) {
            return false;
        }

        if (st.isBoolean()) {
            return st.asBoolean();
        }

        String s = st.asText("").trim().toLowerCase();
        return "true".equals(s) || "success".equals(s) || "ok".equals(s);
    }

    private String authorizationHeaderValue() {
        String token = whatsappApiToken == null ? "" : whatsappApiToken.trim();
        if (token.isEmpty()) {
            return token;
        }

        // Wablas docs use Authorization: {token}.{secret_key}
        if (token.contains(".")) {
            return token;
        }

        String secret = whatsappApiSecretKey == null ? "" : whatsappApiSecretKey.trim();
        if (secret.isEmpty()) {
            return token;
        }

        return token + "." + secret;
    }

    private String wablasTokenOnly() {
        String token = whatsappApiToken == null ? "" : whatsappApiToken.trim();
        if (token.isEmpty()) {
            return token;
        }

        int dot = token.indexOf('.');
        if (dot <= 0) {
            return token;
        }

        return token.substring(0, dot);
    }

    private long maxMediaBytes() {
        return wablasMaxMediaBytes;
    }

    private long wablasHardLimitBytes() {
        return wablasProviderMaxMediaBytes;
    }

    private ZoneId wablasZoneId() {
        String tz = wablasTimezone == null ? "" : wablasTimezone.trim();
        if (tz.isEmpty()) {
            tz = "Asia/Jakarta";
        }
        try {
            return ZoneId.of(tz);
        } catch (Exception ignored) {
            return ZoneId.of("Asia/Jakarta");
        }
    }

    private LocalDateTime parseWablasDateTime(String value) {
        if (value == null) {
            return null;
        }
        String s = value.trim();
        if (s.isEmpty()) {
            return null;
        }

        // Common Wablas formats seen in docs: "yyyy-MM-dd HH:mm:ss"
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

        // If provider returns ISO instant/offset, convert to configured timezone
        try {
            if (s.endsWith("Z")) {
                Instant instant = Instant.parse(s);
                return LocalDateTime.ofInstant(instant, wablasZoneId());
            }
        } catch (DateTimeParseException ignored) {
        }

        try {
            OffsetDateTime odt = OffsetDateTime.parse(s, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
            return LocalDateTime.ofInstant(odt.toInstant(), wablasZoneId());
        } catch (DateTimeParseException ignored) {
        }

        return null;
    }
    
    /**
     * Send invitation message via WhatsApp using Wablas API
     */
    public String sendInvitationMessage(String phoneNumber, String nama, String invitationToken) {
        try {
            String message = buildInvitationMessage(nama, invitationToken);
            return sendWhatsAppMessage(phoneNumber, message);
        } catch (Exception e) {
            logger.error("Failed to send WhatsApp invitation to {}: {}", phoneNumber, e.getMessage());
            throw new RuntimeException("Failed to send WhatsApp invitation: " + e.getMessage());
        }
    }

    public String sendCompanyInvitationMessage(String phoneNumber, String companyName, String invitationToken, int durationDays) {
        try {
            String message = buildCompanyInvitationMessage(companyName, invitationToken, durationDays);
            return sendWhatsAppMessage(phoneNumber, message);
        } catch (Exception e) {
            logger.error("Failed to send WhatsApp company invitation to {}: {}", phoneNumber, e.getMessage());
            throw new RuntimeException("Failed to send WhatsApp invitation: " + e.getMessage());
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
            throw new RuntimeException("Failed to send WhatsApp message: " + e.getMessage());
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

    private String buildCompanyInvitationMessage(String companyName, String invitationToken, int durationDays) {
        String registrationUrl = frontendUrl + "/register/company-invitation?token=" + invitationToken;
        int days = durationDays <= 0 ? 7 : durationDays;

        return String.format(
            "*🏢 Undangan Registrasi Company - CAMOCA 🏢*\n\n" +
            "Halo!\n\n" +
            "Anda diundang untuk mendaftarkan perusahaan: *%s*\n\n" +
            "📱 Klik link berikut untuk mendaftar:\n" +
            "%s\n\n" +
            "⏰ Link ini berlaku selama %d hari.\n\n" +
            "Terima kasih.",
            companyName, registrationUrl, days
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
            headers.set("Authorization", authorizationHeaderValue());
            
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
                // Wablas may return status as boolean or string
                boolean apiSuccess = isWablasSuccess(responseJson);
                
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

                    // Require real message id to avoid false "pending forever"
                    String extractedMessageId = result.get("messageId") == null ? null : String.valueOf(result.get("messageId"));
                    if (extractedMessageId == null || extractedMessageId.isBlank()) {
                        result.put("success", false);
                        result.put("error", "Wablas response missing message id");
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
            validateWablasMaxMediaBytes();

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
            headers.set("Authorization", authorizationHeaderValue());
            
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
                    String messageId = null;
                    String messageStatus = "unknown";
                    
                    try {
                        if (responseJson.has("data") && responseJson.get("data").has("messages")) {
                            JsonNode messages = responseJson.get("data").get("messages");
                            if (messages.isArray() && messages.size() > 0) {
                                JsonNode firstMessage = messages.get(0);

                                if (firstMessage.has("id")) {
                                    String extractedId = firstMessage.get("id").asText();
                                    if (extractedId != null && !extractedId.isEmpty()) {
                                        messageId = extractedId;
                                    }
                                }

                                if (firstMessage.has("status")) {
                                    messageStatus = firstMessage.get("status").asText();
                                }

                                if (firstMessage.has("message")) {
                                    String wablasMessage = firstMessage.get("message").asText();
                                    logger.info("[WABLAS] Message detail: {}", wablasMessage);

                                    if (wablasMessage != null && (
                                        wablasMessage.toLowerCase().contains("not registered") ||
                                        wablasMessage.toLowerCase().contains("invalid") ||
                                        wablasMessage.toLowerCase().contains("tidak terdaftar"))) {
                                        throw new RuntimeException("WhatsApp error: " + wablasMessage);
                                    }
                                }
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

                    if (messageId == null || messageId.isBlank()) {
                        throw new RuntimeException("Wablas response missing message id");
                    }

                    logger.info("[WABLAS] SUCCESS - MessageId: {}, Status: {}, Phone: {}", messageId, messageStatus, cleanPhone);
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
                String url = whatsappApiUrl + "/api/device/info?token=" + wablasTokenOnly();
                ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, HttpEntity.EMPTY, String.class);
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
            String url = whatsappApiUrl + "/api/device/info?token=" + wablasTokenOnly();
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, HttpEntity.EMPTY, String.class);
            
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
            headers.set("Authorization", authorizationHeaderValue());
            
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
            headers.set("Authorization", authorizationHeaderValue());
            
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
                
                boolean apiSuccess = isWablasSuccess(responseJson);
                
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
                                    String createdAtRaw = msg.get("date").get("created_at").asText();
                                    result.put("createdAtRaw", createdAtRaw);
                                    LocalDateTime createdAt = parseWablasDateTime(createdAtRaw);
                                    if (createdAt != null) {
                                        result.put("createdAt", createdAt);
                                    } else {
                                        result.put("createdAt", createdAtRaw);
                                    }
                                }
                                if (msg.get("date").has("updated_at")) {
                                    String updatedAtRaw = msg.get("date").get("updated_at").asText();
                                    result.put("updatedAtRaw", updatedAtRaw);
                                    LocalDateTime updatedAt = parseWablasDateTime(updatedAtRaw);
                                    if (updatedAt != null) {
                                        result.put("updatedAt", updatedAt);
                                    } else {
                                        result.put("updatedAt", updatedAtRaw);
                                    }
                                }
                            }
                            
                            logger.info("[WABLAS] Message {} status: {}", messageId, result.get("status"));
                        } else {
                            result.put("error", "Message not found in response");
                            result.put("success", false);
                        }
                    } else if (responseJson.has("message") && responseJson.get("message").isTextual()) {
                        // Sometimes message can be a string error message
                        result.put("error", responseJson.get("message").asText());
                        result.put("success", false);
                    }

                    // If status is missing/null, treat as not successful
                    if (!Boolean.TRUE.equals(result.get("success"))) {
                        // keep as false
                    } else if (result.get("status") == null) {
                        result.put("error", "Missing status in report response");
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
            headers.set("Authorization", authorizationHeaderValue());
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
                    Thread.sleep(200); // 200ms between batches
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
            headers.set("Authorization", authorizationHeaderValue());
            
            String url = whatsappApiUrl + "/api/v2/send-message";
            
            logger.info("[WABLAS-BULK] Sending {} messages to v2 API", dataArray.size());
            
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.POST, requestEntity, String.class);
            
            logger.info("[WABLAS-BULK] v2 API Response: {}", response.getBody());
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                boolean apiSuccess = isWablasSuccess(responseJson);
                
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

                        // Handle any items not covered by API response (shouldn't happen, but avoid stuck PROCESSING)
                        for (int i = msgIndex; i < validItems.size(); i++) {
                            BulkMessageItem item = validItems.get(i);
                            BulkMessageResult unknownResult = new BulkMessageResult();
                            unknownResult.setOriginalId(item.getOriginalId());
                            unknownResult.setPhone(item.getPhone());
                            unknownResult.setSuccess(false);
                            unknownResult.setError("No response from API for this item");
                            results.add(unknownResult);
                        }
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
            headers.set("Authorization", authorizationHeaderValue());
            
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            String url = whatsappApiUrl + "/api/device/speed";
            
            logger.info("[WABLAS] Setting device speed delay to {} seconds", safeDelay);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.POST, requestEntity, String.class);
            
            logger.info("[WABLAS] Device speed response: {}", response.getBody());
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                if (isWablasSuccess(responseJson)) {
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

    public Map<String, Object> sendDocumentAttachmentWithDetails(String phoneNumber, String caption, String filename, byte[] bytes, MediaType contentType) {
        // Wablas docs (bdg) for local document: POST /api/send-document-from-local with base64 file + json meta
        return sendBase64FileWithDetails("/api/send-document-from-local", phoneNumber, caption, filename, bytes, contentType);
    }

    public Map<String, Object> sendDocumentAttachmentWithDetailsOrLink(
            String phoneNumber,
            String caption,
            String filename,
            byte[] bytes,
            MediaType contentType,
            String documentUrl
    ) {
        Map<String, Object> primary = sendDocumentAttachmentWithDetails(phoneNumber, caption, filename, bytes, contentType);
        if (Boolean.TRUE.equals(primary.get("success"))) {
            return primary;
        }

        String err = primary.get("error") == null ? "" : primary.get("error").toString();
        String errLower = err.toLowerCase();
        boolean packageNotSupport = errLower.contains("package") && errLower.contains("not support");
        boolean tooLarge = errLower.contains("payload too large") || errLower.contains("413");

        if (documentUrl != null && !documentUrl.isBlank() && (packageNotSupport || tooLarge)) {
            return fallbackToTextLink(phoneNumber, caption, documentUrl, err, "document");
        }
        return primary;
    }

    public Map<String, Object> sendImageAttachmentWithDetails(String phoneNumber, String caption, String filename, byte[] bytes, MediaType contentType) {
        // Wablas docs (bdg) for local image: POST /api/send-image-from-local with base64 file + json meta
        Map<String, Object> primary = sendBase64FileWithDetails("/api/send-image-from-local", phoneNumber, caption, filename, bytes, contentType);

        if (Boolean.TRUE.equals(primary.get("success"))) {
            return primary;
        }

        String err = primary.get("error") == null ? "" : primary.get("error").toString();
        String errLower = err.toLowerCase();
        boolean packageNotSupport = errLower.contains("package") && errLower.contains("not support");
        boolean tooLarge = errLower.contains("payload too large") || errLower.contains("413");

        if (packageNotSupport || tooLarge) {
            Map<String, Object> fallback = sendBase64FileWithDetails(
                    "/api/send-document-from-local",
                    phoneNumber,
                    caption,
                    filename,
                    bytes,
                    contentType
            );
            fallback.put("imageFallback", "document-from-local");
            fallback.put("originalError", err);
            return fallback;
        }

        return primary;
    }

    public Map<String, Object> sendImageAttachmentWithDetailsOrLink(
            String phoneNumber,
            String caption,
            String filename,
            byte[] bytes,
            MediaType contentType,
            String imageUrl
    ) {
        Map<String, Object> primary = sendImageAttachmentWithDetails(phoneNumber, caption, filename, bytes, contentType);
        if (Boolean.TRUE.equals(primary.get("success"))) {
            return primary;
        }

        String err = primary.get("error") == null ? "" : primary.get("error").toString();
        String errLower = err.toLowerCase();
        boolean packageNotSupport = errLower.contains("package") && errLower.contains("not support");
        boolean tooLarge = errLower.contains("payload too large") || errLower.contains("413");

        if (imageUrl != null && !imageUrl.isBlank() && (packageNotSupport || tooLarge)) {
            Map<String, Object> fallback = sendMediaUrlWithDetails("/api/send-image", "image", phoneNumber, caption, imageUrl);
            fallback.put("imageFallback", "send-image-url");
            fallback.put("originalError", err);
            return fallback;
        }

        return primary;
    }

    private Map<String, Object> fallbackToTextLink(
            String phoneNumber,
            String caption,
            String url,
            String originalError,
            String kind
    ) {
        Map<String, Object> fallback = new HashMap<>();
        fallback.put("success", false);
        fallback.put("phone", phoneNumber);
        fallback.put("endpoint", "text-link");
        fallback.put("originalError", originalError);
        fallback.put("fallbackKind", kind);

        try {
            String msg = (caption == null ? "" : caption);
            if (!msg.isBlank()) {
                msg = msg + "\n";
            }
            msg = msg + url;

            String messageId = sendWhatsAppMessage(phoneNumber, msg);
            fallback.put("success", true);
            fallback.put("messageId", messageId);
            fallback.put("messageStatus", "pending");
            return fallback;
        } catch (Exception e) {
            fallback.put("error", e.getMessage());
            return fallback;
        }
    }

    public Map<String, Object> sendImageUrlWithDetails(String phoneNumber, String caption, String imageUrl) {
        return sendMediaUrlWithDetails("/api/send-image", "image", phoneNumber, caption, imageUrl);
    }

    public Map<String, Object> sendVideoUrlWithDetails(String phoneNumber, String caption, String videoUrl) {
        return sendMediaUrlWithDetails("/api/send-video", "video", phoneNumber, caption, videoUrl);
    }

    public Map<String, Object> sendVideoFileFromLocalWithDetails(String phoneNumber, String caption, Path filePath) {
        return sendMultipartPathWithDetails(
                "/api/send-video-from-local",
                "file",
                phoneNumber,
                caption,
                filePath,
                MediaType.valueOf("video/mp4")
        );
    }

    public Map<String, Object> sendVideoFileFromLocalWithDetailsOrUrl(
            String phoneNumber,
            String caption,
            Path filePath,
            String fallbackVideoUrl
    ) {
        try {
            if (filePath != null && Files.exists(filePath)) {
                long size = Files.size(filePath);
                long limit = wablasHardLimitBytes();
                if (limit > 0 && size > limit) {
                    String msg = "Wablas media max size is " + limit + " bytes but file is " + size + " bytes";
                    if (fallbackVideoUrl != null && !fallbackVideoUrl.isBlank()) {
                        Map<String, Object> fallback = fallbackToTextLink(
                                phoneNumber,
                                caption,
                                fallbackVideoUrl,
                                msg,
                                "video-too-large"
                        );
                        fallback.put("videoFallback", "text-link-too-large");
                        fallback.put("fileSizeBytes", size);
                        fallback.put("wablasMaxBytes", limit);
                        return fallback;
                    }

                    Map<String, Object> tooLarge = new HashMap<>();
                    tooLarge.put("success", false);
                    tooLarge.put("phone", phoneNumber);
                    tooLarge.put("error", msg);
                    tooLarge.put("fileSizeBytes", size);
                    tooLarge.put("wablasMaxBytes", limit);
                    return tooLarge;
                }
            }
        } catch (Exception ignored) {
        }

        Map<String, Object> primary = sendVideoFileFromLocalWithDetails(phoneNumber, caption, filePath);
        if (Boolean.TRUE.equals(primary.get("success"))) {
            return primary;
        }

        if (fallbackVideoUrl != null && !fallbackVideoUrl.isBlank()) {
            String err = primary.get("error") == null ? "" : String.valueOf(primary.get("error"));
            boolean tooLarge = isPayloadTooLarge(primary);

            String kind;
            if (tooLarge) {
                kind = "video-413";
            } else {
                kind = "video-send-failed";
            }

            Map<String, Object> fallback = fallbackToTextLink(
                    phoneNumber,
                    caption,
                    fallbackVideoUrl,
                    err.isBlank() ? null : err,
                    kind
            );

            fallback.put("videoFallback", tooLarge ? "text-link-after-413" : "text-link-after-any-error");
            fallback.put("originalError", primary.get("error"));
            fallback.put("originalHttpStatus", primary.get("httpStatus"));
            fallback.put("originalRawResponse", primary.get("rawResponse"));
            fallback.put("fallbackVideoUrl", fallbackVideoUrl);
            return fallback;
        }

        return primary;
    }

    private boolean isPayloadTooLarge(Map<String, Object> result) {
        if (result == null) {
            return false;
        }

        Object httpStatusObj = result.get("httpStatus");
        if (httpStatusObj != null) {
            try {
                int code = Integer.parseInt(String.valueOf(httpStatusObj));
                if (code == 413) {
                    return true;
                }
            } catch (Exception ignored) {
            }
        }

        String err = result.get("error") == null ? "" : String.valueOf(result.get("error"));
        String raw = result.get("rawResponse") == null ? "" : String.valueOf(result.get("rawResponse"));
        String combined = (err + "\n" + raw).toLowerCase(Locale.ROOT);
        if (combined.contains("413") || combined.contains("payload too large") || combined.contains("post data is too large")) {
            return true;
        }

        if (raw != null && !raw.isBlank()) {
            try {
                JsonNode json = objectMapper.readTree(raw);
                if (json != null && json.has("code") && json.get("code").asInt(-1) == 413) {
                    return true;
                }
            } catch (Exception ignored) {
            }
        }

        return false;
    }

    public Map<String, Object> sendTextMessageWithDetails(String phoneNumber, String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("phone", phoneNumber);
        result.put("endpoint", "text");

        try {
            String messageId = sendWhatsAppMessage(phoneNumber, message);
            result.put("success", true);
            result.put("messageId", messageId);
            result.put("messageStatus", "pending");
            return result;
        } catch (Exception e) {
            result.put("error", e.getMessage());
            return result;
        }
    }

    public Map<String, Object> sendVideoAttachmentWithDetails(String phoneNumber, String caption, String filename, byte[] bytes) {
        // Wablas docs (bdg) for local video: POST /api/send-video-from-local with multipart field name 'file'
        Map<String, Object> primary = sendMultipartFileWithDetails(
                "/api/send-video-from-local",
                "file",
                phoneNumber,
                caption,
                filename,
                bytes,
                MediaType.valueOf("video/mp4")
        );

        if (Boolean.TRUE.equals(primary.get("success"))) {
            return primary;
        }

        String err = primary.get("error") == null ? null : primary.get("error").toString();
        if (err != null && err.toLowerCase().contains("package") && err.toLowerCase().contains("not support")) {
            Map<String, Object> fallback = sendBase64FileWithDetails(
                    "/api/send-document-from-local",
                    phoneNumber,
                    caption,
                    filename,
                    bytes,
                    MediaType.valueOf("video/mp4")
            );
            fallback.put("videoFallback", "document-from-local");
            return fallback;
        }

        return primary;
    }

    public Map<String, Object> sendVideoAttachmentWithDetailsOrLink(
            String phoneNumber,
            String caption,
            String filename,
            byte[] bytes,
            String videoUrl
    ) {
        Map<String, Object> primary = sendMultipartFileWithDetails(
                "/api/send-video-from-local",
                "file",
                phoneNumber,
                caption,
                filename,
                bytes,
                MediaType.valueOf("video/mp4")
        );

        if (Boolean.TRUE.equals(primary.get("success"))) {
            return primary;
        }

        String err = primary.get("error") == null ? "" : primary.get("error").toString();
        String errLower = err.toLowerCase(Locale.ROOT);
        boolean packageNotSupport = errLower.contains("package") && errLower.contains("not support");
        boolean tooLarge = errLower.contains("payload too large") || errLower.contains("413") || errLower.contains("too large");

        // If local-send fails, try: upload to Wablas -> send by URL (more reliable per docs)
        // Only attempt upload when we actually have bytes and within configured max.
        long limit = maxMediaBytes();
        if (!Boolean.TRUE.equals(primary.get("success"))
            && bytes != null
            && bytes.length > 0
            && limit > 0
            && bytes.length <= limit
        ) {
            Map<String, Object> upload = uploadFileToWablas("video", filename, bytes, MediaType.valueOf("video/mp4"));
            if (Boolean.TRUE.equals(upload.get("success"))) {
                String uploadedUrl = upload.get("url") == null ? null : upload.get("url").toString();
                if (uploadedUrl != null && !uploadedUrl.isBlank()) {
                    Map<String, Object> viaUrl = sendMediaUrlWithDetails("/api/send-video", "video", phoneNumber, caption, uploadedUrl);
                    viaUrl.put("videoFallback", "upload-video-then-send-video");
                    viaUrl.put("originalError", err);
                    viaUrl.put("uploadedUrl", uploadedUrl);
                    if (Boolean.TRUE.equals(viaUrl.get("success"))) {
                        return viaUrl;
                    }
                }
            }
        }

        // If URL-based sending is needed (package limitation or payload too large), use provided videoUrl when available.
        if (videoUrl != null && !videoUrl.isBlank() && (packageNotSupport || tooLarge)) {
            Map<String, Object> fallback = sendMediaUrlWithDetails("/api/send-video", "video", phoneNumber, caption, videoUrl);
            fallback.put("videoFallback", "send-video-url");
            fallback.put("originalError", err);
            return fallback;
        }

        return primary;
    }

    // ===============================================
    // BULK VIDEO MESSAGING - Wablas v2 API
    // Supports up to 100 items per batch
    // Reference: https://tegal.wablas.com/documentation/api
    // ===============================================

    public static class BulkVideoItem {
        private final String phone;
        private final String caption;
        private final String videoUrl;
        private final String originalId;

        public BulkVideoItem(String phone, String caption, String videoUrl, String originalId) {
            this.phone = phone;
            this.caption = caption;
            this.videoUrl = videoUrl;
            this.originalId = originalId;
        }

        public String getPhone() {
            return phone;
        }

        public String getCaption() {
            return caption;
        }

        public String getVideoUrl() {
            return videoUrl;
        }

        public String getOriginalId() {
            return originalId;
        }
    }

    public static class BulkVideoResult {
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

    public List<BulkVideoResult> sendBulkVideos(List<BulkVideoItem> items) {
        return sendBulkVideosWithRetry(items, MAX_RETRY_ATTEMPTS);
    }

    public List<BulkVideoResult> sendBulkVideosWithRetry(List<BulkVideoItem> items, int maxRetries) {
        List<BulkVideoResult> allResults = new ArrayList<>();

        if (items == null || items.isEmpty()) {
            logger.warn("[WABLAS-BULK-VIDEO] No items to send");
            return allResults;
        }

        logger.info("[WABLAS-BULK-VIDEO] ========================================");
        logger.info("[WABLAS-BULK-VIDEO] Starting bulk video send for {} items", items.size());
        logger.info("[WABLAS-BULK-VIDEO] Batch size: {}, Max retries: {}", BULK_BATCH_SIZE, maxRetries);
        logger.info("[WABLAS-BULK-VIDEO] ========================================");

        List<List<BulkVideoItem>> batches = splitIntoBatches(items, BULK_BATCH_SIZE);
        int batchNumber = 0;

        for (List<BulkVideoItem> batch : batches) {
            batchNumber++;
            logger.info("[WABLAS-BULK-VIDEO] Processing batch {}/{} ({} items)", batchNumber, batches.size(), batch.size());

            List<BulkVideoResult> batchResults = sendVideoBatchWithRetry(batch, maxRetries, batchNumber, batches.size());
            allResults.addAll(batchResults);

            long successCount = batchResults.stream().filter(BulkVideoResult::isSuccess).count();
            logger.info("[WABLAS-BULK-VIDEO] Batch {}/{} complete - Success: {}, Failed: {}",
                    batchNumber, batches.size(), successCount, batch.size() - successCount);

            if (batchNumber < batches.size()) {
                try {
                    Thread.sleep(200);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    logger.error("[WABLAS-BULK-VIDEO] Interrupted at batch {}", batchNumber);
                    break;
                }
            }
        }

        long totalSuccess = allResults.stream().filter(BulkVideoResult::isSuccess).count();
        logger.info("[WABLAS-BULK-VIDEO] ========================================");
        logger.info("[WABLAS-BULK-VIDEO] COMPLETE - Total: {}, Success: {}, Failed: {}",
                allResults.size(), totalSuccess, allResults.size() - totalSuccess);
        logger.info("[WABLAS-BULK-VIDEO] ========================================");

        return allResults;
    }

    private List<BulkVideoResult> sendVideoBatchWithRetry(List<BulkVideoItem> batch, int maxRetries, int batchNum, int totalBatches) {
        List<BulkVideoResult> results = new ArrayList<>();
        List<BulkVideoItem> itemsToRetry = new ArrayList<>(batch);

        for (int attempt = 1; attempt <= maxRetries && !itemsToRetry.isEmpty(); attempt++) {
            logger.info("[WABLAS-BULK-VIDEO] Batch {}/{} - Attempt {}/{} ({} items)",
                    batchNum, totalBatches, attempt, maxRetries, itemsToRetry.size());

            try {
                List<BulkVideoResult> attemptResults = sendBulkVideoBatch(itemsToRetry);
                List<BulkVideoItem> stillFailed = new ArrayList<>();

                for (BulkVideoResult result : attemptResults) {
                    if (result.isSuccess()) {
                        results.add(result);
                    } else {
                        if (isRetryableError(result.getError()) && attempt < maxRetries) {
                            BulkVideoItem originalItem = findVideoItemByOriginalId(itemsToRetry, result.getOriginalId());
                            if (originalItem != null) {
                                stillFailed.add(originalItem);
                                logger.debug("[WABLAS-BULK-VIDEO] Will retry item {} - Error: {}", result.getOriginalId(), result.getError());
                            } else {
                                results.add(result);
                            }
                        } else {
                            results.add(result);
                        }
                    }
                }

                itemsToRetry = stillFailed;

                if (!itemsToRetry.isEmpty() && attempt < maxRetries) {
                    logger.info("[WABLAS-BULK-VIDEO] {} items need retry, waiting {}ms...", itemsToRetry.size(), RETRY_DELAY_MS);
                    Thread.sleep(RETRY_DELAY_MS);
                }

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                logger.error("[WABLAS-BULK-VIDEO] Interrupted during retry");

                for (BulkVideoItem item : itemsToRetry) {
                    BulkVideoResult failResult = new BulkVideoResult();
                    failResult.setOriginalId(item.getOriginalId());
                    failResult.setPhone(item.getPhone());
                    failResult.setSuccess(false);
                    failResult.setError("Interrupted during retry");
                    results.add(failResult);
                }
                break;

            } catch (Exception e) {
                logger.error("[WABLAS-BULK-VIDEO] Error in attempt {}: {}", attempt, e.getMessage());

                if (attempt == maxRetries) {
                    for (BulkVideoItem item : itemsToRetry) {
                        BulkVideoResult failResult = new BulkVideoResult();
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

    private BulkVideoItem findVideoItemByOriginalId(List<BulkVideoItem> items, String originalId) {
        if (originalId == null) return null;
        return items.stream()
                .filter(item -> originalId.equals(item.getOriginalId()))
                .findFirst()
                .orElse(null);
    }

    private List<BulkVideoResult> sendBulkVideoBatch(List<BulkVideoItem> batch) {
        List<BulkVideoResult> results = new ArrayList<>();

        try {
            List<Map<String, String>> dataArray = new ArrayList<>();
            List<BulkVideoItem> validItems = new ArrayList<>();

            for (BulkVideoItem item : batch) {
                String formattedPhone = formatPhoneNumberForWhatsApp(item.getPhone());

                if (formattedPhone == null || formattedPhone.length() < 10) {
                    BulkVideoResult failResult = new BulkVideoResult();
                    failResult.setOriginalId(item.getOriginalId());
                    failResult.setPhone(item.getPhone());
                    failResult.setSuccess(false);
                    failResult.setError("Invalid phone number format");
                    results.add(failResult);
                    continue;
                }

                if (item.getVideoUrl() == null || item.getVideoUrl().isBlank()) {
                    BulkVideoResult failResult = new BulkVideoResult();
                    failResult.setOriginalId(item.getOriginalId());
                    failResult.setPhone(item.getPhone());
                    failResult.setSuccess(false);
                    failResult.setError("Video URL is empty");
                    results.add(failResult);
                    continue;
                }

                Map<String, String> msgData = new HashMap<>();
                msgData.put("phone", formattedPhone);
                msgData.put("video", item.getVideoUrl());
                if (item.getCaption() != null && !item.getCaption().isBlank()) {
                    msgData.put("caption", item.getCaption());
                }
                dataArray.add(msgData);
                validItems.add(item);
            }

            if (dataArray.isEmpty()) {
                logger.warn("[WABLAS-BULK-VIDEO] No valid items in batch");
                return results;
            }

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("data", dataArray);
            requestBody.put("retry", true);
            requestBody.put("priority", false);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", authorizationHeaderValue());

            String url = whatsappApiUrl + "/api/v2/send-video";
            logger.info("[WABLAS-BULK-VIDEO] Sending {} video messages to v2 API", dataArray.size());

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);

            logger.info("[WABLAS-BULK-VIDEO] v2 API Response: {}", response.getBody());

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                boolean apiSuccess = isWablasSuccess(responseJson);

                if (apiSuccess && responseJson.has("data") && responseJson.get("data").has("messages")) {
                    JsonNode messages = responseJson.get("data").get("messages");

                    if (messages.isArray()) {
                        int msgIndex = 0;
                        for (JsonNode msgNode : messages) {
                            String phone = msgNode.has("phone") ? msgNode.get("phone").asText() : "";
                            String messageId = msgNode.has("id") ? msgNode.get("id").asText() : "";
                            String status = msgNode.has("status") ? msgNode.get("status").asText() : "unknown";
                            String detail = msgNode.has("message") ? msgNode.get("message").asText() : "";

                            BulkVideoItem originalItem = msgIndex < validItems.size() ? validItems.get(msgIndex) : null;
                            BulkVideoResult result = new BulkVideoResult();
                            result.setPhone(phone);
                            result.setMessageId(messageId);
                            result.setStatus(status);
                            result.setOriginalId(originalItem != null ? originalItem.getOriginalId() : null);

                            if ("failed".equalsIgnoreCase(status) ||
                                    "error".equalsIgnoreCase(status) ||
                                    "rejected".equalsIgnoreCase(status) ||
                                    "cancel".equalsIgnoreCase(status) ||
                                    (detail != null && detail.toLowerCase(Locale.ROOT).contains("not registered"))) {
                                result.setSuccess(false);
                                result.setError(detail != null && !detail.isEmpty() ? detail : "Status: " + status);
                            } else {
                                result.setSuccess(true);
                            }

                            results.add(result);
                            msgIndex++;
                        }

                        for (int i = msgIndex; i < validItems.size(); i++) {
                            BulkVideoItem item = validItems.get(i);
                            BulkVideoResult unknownResult = new BulkVideoResult();
                            unknownResult.setOriginalId(item.getOriginalId());
                            unknownResult.setPhone(item.getPhone());
                            unknownResult.setSuccess(false);
                            unknownResult.setError("No response from API for this item");
                            results.add(unknownResult);
                        }
                    }
                } else {
                    String errorMsg = responseJson.has("message") ? responseJson.get("message").asText() : "Unknown error";
                    logger.error("[WABLAS-BULK-VIDEO] API error: {}", errorMsg);

                    for (BulkVideoItem item : validItems) {
                        BulkVideoResult failResult = new BulkVideoResult();
                        failResult.setOriginalId(item.getOriginalId());
                        failResult.setPhone(item.getPhone());
                        failResult.setSuccess(false);
                        failResult.setError("API error: " + errorMsg);
                        results.add(failResult);
                    }
                }
            } else {
                logger.error("[WABLAS-BULK-VIDEO] HTTP error: {}", response.getStatusCode());

                for (BulkVideoItem item : validItems) {
                    BulkVideoResult failResult = new BulkVideoResult();
                    failResult.setOriginalId(item.getOriginalId());
                    failResult.setPhone(item.getPhone());
                    failResult.setSuccess(false);
                    failResult.setError("HTTP " + response.getStatusCode());
                    results.add(failResult);
                }
            }

        } catch (Exception e) {
            logger.error("[WABLAS-BULK-VIDEO] Exception in batch: {}", e.getMessage(), e);
            throw new RuntimeException("Bulk video send error: " + e.getMessage(), e);
        }

        return results;
    }

    private Map<String, Object> sendMediaUrlWithDetails(
            String endpoint,
            String mediaParamName,
            String phoneNumber,
            String caption,
            String mediaUrl
    ) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("phone", phoneNumber);
        result.put("endpoint", endpoint);

        try {
            String cleanPhone = formatPhoneNumberForWhatsApp(phoneNumber);
            result.put("formattedPhone", cleanPhone);

            if (cleanPhone == null || cleanPhone.length() < 10) {
                result.put("error", "Invalid phone number format: " + phoneNumber);
                return result;
            }
            if (mediaUrl == null || mediaUrl.isBlank()) {
                result.put("error", "Media URL is empty");
                return result;
            }

            // Wablas docs use application/x-www-form-urlencoded for v1 endpoints like /api/send-image, /api/send-video
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("phone", cleanPhone);
            body.add(mediaParamName, mediaUrl);
            if (caption != null && !caption.isBlank()) {
                body.add("caption", caption);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("Authorization", authorizationHeaderValue());

            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);
            String url = whatsappApiUrl + endpoint;

            logger.info("[WABLAS] Sending media URL to {} via {}", cleanPhone, url);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);

            result.put("httpStatus", response.getStatusCode().value());
            result.put("rawResponse", response.getBody());

            if (response.getStatusCode() != HttpStatus.OK) {
                result.put("error", "HTTP " + response.getStatusCode());
                return result;
            }

            JsonNode responseJson = objectMapper.readTree(response.getBody());
            boolean apiSuccess = isWablasSuccess(responseJson);
            if (!apiSuccess) {
                String errorMsg = responseJson.has("message") ? responseJson.get("message").asText() : "Unknown error";
                if (responseJson.has("data") && responseJson.get("data").has("message")) {
                    errorMsg = responseJson.get("data").get("message").asText();
                }
                if (errorMsg == null || errorMsg.isBlank()) {
                    String statusText = responseJson.has("status") ? responseJson.get("status").asText() : "";
                    errorMsg = "Wablas API returned unsuccessful status: " + statusText;
                }
                result.put("error", errorMsg);
                return result;
            }

            result.put("success", true);

            if (responseJson.has("data") && responseJson.get("data").has("messages")) {
                JsonNode messages = responseJson.get("data").get("messages");
                if (messages.isArray() && messages.size() > 0) {
                    JsonNode first = messages.get(0);
                    if (first.has("id")) {
                        result.put("messageId", first.get("id").asText());
                    }
                    if (first.has("status")) {
                        result.put("messageStatus", first.get("status").asText());
                    }
                    if (first.has("message")) {
                        result.put("messageDetail", first.get("message").asText());
                    }
                }
            }

            String mid = result.containsKey("messageId") && result.get("messageId") != null
                    ? result.get("messageId").toString().trim()
                    : "";
            if (mid.isBlank()) {
                result.put("success", false);
                result.put("error", "Wablas response missing message id");
                return result;
            }

            return result;
        } catch (Exception e) {
            logger.error("[WABLAS] Media URL send failed: {}", e.getMessage());
            result.put("error", e.getMessage());
            return result;
        }
    }

    private Map<String, Object> uploadFileToWablas(
            String type,
            String filename,
            byte[] bytes,
            MediaType contentType
    ) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("type", type);

        try {
            String safeType = type == null ? "" : type.trim().toLowerCase(Locale.ROOT);
            if (!("image".equals(safeType) || "video".equals(safeType) || "audio".equals(safeType) || "document".equals(safeType))) {
                result.put("error", "Invalid upload type: " + type);
                return result;
            }
            if (bytes == null || bytes.length == 0) {
                result.put("error", "Attachment is empty");
                return result;
            }
            long limit = maxMediaBytes();
            if (limit > 0 && bytes.length > limit) {
                result.put("error", "Attachment exceeds Wablas max size (" + limit + " bytes): " + bytes.length);
                return result;
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("Authorization", authorizationHeaderValue());

            Resource resource = new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return (filename == null || filename.isBlank())
                            ? ("upload-" + safeType)
                            : filename;
                }
            };

            HttpHeaders fileHeaders = new HttpHeaders();
            if (contentType != null) {
                fileHeaders.setContentType(contentType);
            }
            fileHeaders.setContentDisposition(ContentDisposition.formData().name("file").filename(resource.getFilename()).build());

            HttpEntity<Resource> filePart = new HttpEntity<>(resource, fileHeaders);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", filePart);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            String url = whatsappApiUrl + "/api/upload/" + safeType;

            logger.info("[WABLAS] Uploading {} bytes type={} to {}", bytes.length, safeType, url);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);

            result.put("httpStatus", response.getStatusCode().value());
            result.put("rawResponse", response.getBody());

            if (response.getStatusCode() != HttpStatus.OK) {
                result.put("error", "HTTP " + response.getStatusCode());
                return result;
            }

            JsonNode responseJson = objectMapper.readTree(response.getBody());
            if (!isWablasSuccess(responseJson)) {
                String errorMsg = responseJson.has("message") ? responseJson.get("message").asText() : "Upload failed";
                if (responseJson.has("data") && responseJson.get("data").has("message")) {
                    errorMsg = responseJson.get("data").get("message").asText();
                }
                result.put("error", errorMsg);
                return result;
            }

            String uploadedUrl = null;
            if (responseJson.has("data") && responseJson.get("data").has("messages")) {
                JsonNode messages = responseJson.get("data").get("messages");
                if (messages.isArray() && messages.size() > 0) {
                    JsonNode first = messages.get(0);
                    if (first.has("url")) {
                        uploadedUrl = first.get("url").asText();
                    }
                }
            }

            if (uploadedUrl == null || uploadedUrl.isBlank()) {
                result.put("error", "Upload succeeded but url missing");
                return result;
            }

            result.put("success", true);
            result.put("url", uploadedUrl);
            return result;

        } catch (Exception e) {
            logger.error("[WABLAS] Upload failed: {}", e.getMessage());
            result.put("error", e.getMessage());
            return result;
        }
    }
    
    private Map<String, Object> sendBase64FileWithDetails(
            String endpoint,
            String phoneNumber,
            String caption,
            String filename,
            byte[] bytes,
            MediaType contentType
    ) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("phone", phoneNumber);
        result.put("endpoint", endpoint);
        
        try {
            String cleanPhone = formatPhoneNumberForWhatsApp(phoneNumber);
            result.put("formattedPhone", cleanPhone);
            
            if (cleanPhone == null || cleanPhone.length() < 10) {
                result.put("error", "Invalid phone number format: " + phoneNumber);
                return result;
            }
            if (bytes == null || bytes.length == 0) {
                result.put("error", "Attachment is empty");
                return result;
            }
            
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("phone", cleanPhone);
            if (caption != null && !caption.isBlank()) {
                body.add("caption", caption);
            }

            // Optional filename parameters (per Wablas docs)
            if (filename != null && !filename.isBlank()) {
                if (endpoint != null && endpoint.contains("send-image-from-local")) {
                    body.add("filename", filename);
                } else if (endpoint != null && endpoint.contains("send-document-from-local")) {
                    body.add("name_file", filename);
                }
            }
            
            body.add("file", Base64.getEncoder().encodeToString(bytes));
            
            Map<String, Object> meta = new HashMap<>();
            if (filename != null && !filename.isBlank()) {
                meta.put("name", filename);
            }
            meta.put("size", bytes.length);
            if (contentType != null) {
                meta.put("type", contentType.toString());
            }
            body.add("data", objectMapper.writeValueAsString(meta));
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("Authorization", authorizationHeaderValue());
            
            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);
            String url = whatsappApiUrl + endpoint;
            
            logger.info("[WABLAS] Sending base64 file to {} via {}", cleanPhone, url);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);
            
            result.put("httpStatus", response.getStatusCode().value());
            result.put("rawResponse", response.getBody());
            
            if (response.getStatusCode() != HttpStatus.OK) {
                result.put("error", "HTTP " + response.getStatusCode());
                return result;
            }
            
            JsonNode responseJson = objectMapper.readTree(response.getBody());
            boolean apiSuccess = isWablasSuccess(responseJson);
            if (!apiSuccess) {
                String errorMsg = responseJson.has("message") ? responseJson.get("message").asText() : "Unknown error";
                if (responseJson.has("data") && responseJson.get("data").has("message")) {
                    errorMsg = responseJson.get("data").get("message").asText();
                }
                if (errorMsg == null || errorMsg.isBlank()) {
                    String statusText = responseJson.has("status") ? responseJson.get("status").asText() : "";
                    errorMsg = "Wablas API returned unsuccessful status: " + statusText;
                }
                result.put("error", errorMsg);
                return result;
            }
            
            result.put("success", true);

            if (responseJson.has("data") && !responseJson.get("data").isNull()) {
                JsonNode data = responseJson.get("data");
                if (data.has("id")) {
                    result.put("messageId", data.get("id").asText());
                }
                if (data.has("status")) {
                    result.put("messageStatus", data.get("status").asText());
                }
                if (data.has("message")) {
                    result.put("messageDetail", data.get("message").asText());
                }

                if (!result.containsKey("messageId") && data.has("messages")) {
                    JsonNode messages = data.get("messages");
                    if (messages.isArray() && messages.size() > 0) {
                        JsonNode first = messages.get(0);
                        if (first.has("id")) {
                            result.put("messageId", first.get("id").asText());
                        }
                        if (first.has("status")) {
                            result.put("messageStatus", first.get("status").asText());
                        }
                        if (first.has("message")) {
                            result.put("messageDetail", first.get("message").asText());
                        }
                    }
                }
            }

            String mid = result.containsKey("messageId") && result.get("messageId") != null
                    ? result.get("messageId").toString().trim()
                    : "";
            if (mid.isBlank()) {
                result.put("success", false);
                result.put("error", "Wablas response missing message id");
                return result;
            }
            
            return result;
        } catch (Exception e) {
            logger.error("[WABLAS] Base64 send failed: {}", e.getMessage());
            result.put("error", e.getMessage());
            return result;
        }
    }

    private Map<String, Object> sendMultipartFileWithDetails(
            String endpoint,
            String fileFieldName,
            String phoneNumber,
            String caption,
            String filename,
            byte[] bytes,
            MediaType contentType
    ) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("phone", phoneNumber);
        result.put("endpoint", endpoint);

        try {
            String cleanPhone = formatPhoneNumberForWhatsApp(phoneNumber);
            result.put("formattedPhone", cleanPhone);

            if (cleanPhone == null || cleanPhone.length() < 10) {
                result.put("error", "Invalid phone number format: " + phoneNumber);
                return result;
            }
            if (bytes == null || bytes.length == 0) {
                result.put("error", "Attachment is empty");
                return result;
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("Authorization", authorizationHeaderValue());

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("phone", cleanPhone);
            if (caption != null && !caption.isBlank()) {
                body.add("caption", caption);
            }

            Resource resource = new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return filename == null || filename.isBlank() ? "attachment" : filename;
                }
            };

            HttpHeaders fileHeaders = new HttpHeaders();
            if (contentType != null) {
                fileHeaders.setContentType(contentType);
            }
            fileHeaders.setContentDisposition(ContentDisposition.formData().name(fileFieldName).filename(resource.getFilename()).build());

            HttpEntity<Resource> filePart = new HttpEntity<>(resource, fileHeaders);
            body.add(fileFieldName, filePart);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            String url = whatsappApiUrl + endpoint;

            logger.info("[WABLAS] Sending attachment to {} via {}", cleanPhone, url);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);

            result.put("httpStatus", response.getStatusCode().value());
            result.put("rawResponse", response.getBody());

            if (response.getStatusCode() != HttpStatus.OK) {
                result.put("error", "HTTP " + response.getStatusCode());
                return result;
            }

            JsonNode responseJson = objectMapper.readTree(response.getBody());
            boolean apiSuccess = isWablasSuccess(responseJson);
            if (!apiSuccess) {
                String errorMsg = responseJson.has("message") ? responseJson.get("message").asText() : "Unknown error";
                if (responseJson.has("data") && responseJson.get("data").has("message")) {
                    errorMsg = responseJson.get("data").get("message").asText();
                }
                if (errorMsg == null || errorMsg.isBlank()) {
                    String statusText = responseJson.has("status") ? responseJson.get("status").asText() : "";
                    errorMsg = "Wablas API returned unsuccessful status: " + statusText;
                }
                result.put("error", errorMsg);
                return result;
            }

            result.put("success", true);

            if (responseJson.has("data") && !responseJson.get("data").isNull()) {
                JsonNode data = responseJson.get("data");
                if (data.has("id")) {
                    result.put("messageId", data.get("id").asText());
                }
                if (data.has("status")) {
                    result.put("messageStatus", data.get("status").asText());
                }
                if (data.has("message")) {
                    result.put("messageDetail", data.get("message").asText());
                }

                if (!result.containsKey("messageId") && data.has("messages")) {
                    JsonNode messages = data.get("messages");
                    if (messages.isArray() && messages.size() > 0) {
                        JsonNode first = messages.get(0);
                        if (first.has("id")) {
                            result.put("messageId", first.get("id").asText());
                        }
                        if (first.has("status")) {
                            result.put("messageStatus", first.get("status").asText());
                        }
                        if (first.has("message")) {
                            result.put("messageDetail", first.get("message").asText());
                        }
                    }
                }
            }

            String mid = result.containsKey("messageId") && result.get("messageId") != null
                    ? result.get("messageId").toString().trim()
                    : "";
            if (mid.isBlank()) {
                result.put("success", false);
                result.put("error", "Wablas response missing message id");
                return result;
            }

            return result;
        } catch (HttpStatusCodeException e) {
            result.put("httpStatus", e.getStatusCode().value());
            result.put("rawResponse", e.getResponseBodyAsString());
            result.put("error", e.getMessage());
            return result;
        } catch (Exception e) {
            logger.error("[WABLAS] Attachment send failed: {}", e.getMessage());
            result.put("error", e.getMessage());
            return result;
        }
    }

    private Map<String, Object> sendMultipartPathWithDetails(
            String endpoint,
            String fileFieldName,
            String phoneNumber,
            String caption,
            Path filePath,
            MediaType contentType
    ) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("phone", phoneNumber);
        result.put("endpoint", endpoint);

        try {
            String cleanPhone = formatPhoneNumberForWhatsApp(phoneNumber);
            result.put("formattedPhone", cleanPhone);

            if (cleanPhone == null || cleanPhone.length() < 10) {
                result.put("error", "Invalid phone number format: " + phoneNumber);
                return result;
            }
            if (filePath == null) {
                result.put("error", "File path is null");
                return result;
            }
            if (!Files.exists(filePath)) {
                result.put("error", "File not found: " + filePath);
                return result;
            }
            long size = Files.size(filePath);
            if (size <= 0) {
                result.put("error", "File is empty: " + filePath);
                return result;
            }
            long limit = maxMediaBytes();
            if (limit > 0 && size > limit) {
                result.put("error", "Attachment exceeds Wablas max size (" + limit + " bytes): " + size);
                return result;
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("Authorization", authorizationHeaderValue());

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("phone", cleanPhone);
            if (caption != null && !caption.isBlank()) {
                body.add("caption", caption);
            }

                    String filename = "attachment";
                    Path fileNamePath = filePath.getFileName();
                    if (fileNamePath != null) {
                        String candidate = fileNamePath.toString();
                        if (candidate != null && !candidate.isBlank()) {
                            filename = candidate;
                        }
                    }

                Resource resource = new FileSystemResource(filePath.toFile());

            HttpHeaders fileHeaders = new HttpHeaders();
            if (contentType != null) {
                fileHeaders.setContentType(contentType);
            }
            fileHeaders.setContentDisposition(ContentDisposition.formData().name(fileFieldName).filename(filename).build());

            HttpEntity<Resource> filePart = new HttpEntity<>(resource, fileHeaders);
            body.add(fileFieldName, filePart);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            String url = whatsappApiUrl + endpoint;

            logger.info("[WABLAS] Sending attachment (path) to {} via {}", cleanPhone, url);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);

            result.put("httpStatus", response.getStatusCode().value());
            result.put("rawResponse", response.getBody());

            if (response.getStatusCode() != HttpStatus.OK) {
                result.put("error", "HTTP " + response.getStatusCode());
                return result;
            }

            JsonNode responseJson = objectMapper.readTree(response.getBody());
            boolean apiSuccess = isWablasSuccess(responseJson);
            if (!apiSuccess) {
                String errorMsg = responseJson.has("message") ? responseJson.get("message").asText() : "Unknown error";
                if (responseJson.has("data") && responseJson.get("data").has("message")) {
                    errorMsg = responseJson.get("data").get("message").asText();
                }
                if (errorMsg == null || errorMsg.isBlank()) {
                    String statusText = responseJson.has("status") ? responseJson.get("status").asText() : "";
                    errorMsg = "Wablas API returned unsuccessful status: " + statusText;
                }
                result.put("error", errorMsg);
                return result;
            }

            result.put("success", true);

            if (responseJson.has("data") && !responseJson.get("data").isNull()) {
                JsonNode data = responseJson.get("data");
                if (data.has("id")) {
                    result.put("messageId", data.get("id").asText());
                }
                if (data.has("status")) {
                    result.put("messageStatus", data.get("status").asText());
                }
                if (data.has("message")) {
                    result.put("messageDetail", data.get("message").asText());
                }

                if (!result.containsKey("messageId") && data.has("messages")) {
                    JsonNode messages = data.get("messages");
                    if (messages.isArray() && messages.size() > 0) {
                        JsonNode first = messages.get(0);
                        if (first.has("id")) {
                            result.put("messageId", first.get("id").asText());
                        }
                        if (first.has("status")) {
                            result.put("messageStatus", first.get("status").asText());
                        }
                        if (first.has("message")) {
                            result.put("messageDetail", first.get("message").asText());
                        }
                    }
                }
            }

            String mid = result.containsKey("messageId") && result.get("messageId") != null
                    ? result.get("messageId").toString().trim()
                    : "";
            if (mid.isBlank()) {
                result.put("success", false);
                result.put("error", "Wablas response missing message id");
                return result;
            }

            return result;
        } catch (HttpStatusCodeException e) {
            result.put("httpStatus", e.getStatusCode().value());
            result.put("rawResponse", e.getResponseBodyAsString());
            result.put("error", e.getMessage());
            return result;
        } catch (Exception e) {
            logger.error("[WABLAS] Attachment(path) send failed: {}", e.getMessage());
            result.put("error", e.getMessage());
            return result;
        }
    }

}
