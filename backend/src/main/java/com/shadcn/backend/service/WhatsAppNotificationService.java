package com.shadcn.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WhatsAppNotificationService {
    
    private final RestTemplate restTemplate;
    
    @Value("${whatsapp.fonnte.api-url:https://api.fonnte.com/send}")
    private String fonnteApiUrl;
    
    @Value("${whatsapp.fonnte.token:}")
    private String fonnteToken;
    
    @Value("${app.base-url:http://localhost:3000}")
    private String appBaseUrl;
    
    /**
     * Format nomor telepon dari format Indonesia (08xxx) ke format internasional (628xxx)
     */
    public String formatPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            return phoneNumber;
        }
        
        // Remove all spaces, dashes, and other non-numeric characters
        String cleaned = phoneNumber.replaceAll("[^0-9]", "");
        
        // If starts with 0, replace with 62
        if (cleaned.startsWith("0")) {
            return "62" + cleaned.substring(1);
        }
        
        // If starts with +62, remove +
        if (cleaned.startsWith("62")) {
            return cleaned;
        }
        
        // If starts with 8, add 62
        if (cleaned.startsWith("8")) {
            return "62" + cleaned;
        }
        
        return cleaned;
    }
    
    /**
     * Kirim notifikasi WhatsApp untuk user baru
     */
    public void sendWelcomeNotification(String phoneNumber, String fullName, String username, String password, String roleName) {
        try {
            // Check if token is configured
            if (fonnteToken == null || fonnteToken.trim().isEmpty()) {
                log.warn("WhatsApp notification disabled: Fonnte token not configured");
                return;
            }
            
            String formattedPhone = formatPhoneNumber(phoneNumber);
            
            // Build message
            String message = buildWelcomeMessage(fullName, username, password, roleName);
            
            // Send WhatsApp message
            sendWhatsAppMessage(formattedPhone, message);
            
            log.info("WhatsApp welcome notification sent to {}", formattedPhone);
        } catch (Exception e) {
            log.error("Failed to send WhatsApp notification to {}: {}", phoneNumber, e.getMessage());
            // Don't throw exception - notification failure should not fail user creation
        }
    }
    
    /**
     * Build welcome message
     */
    private String buildWelcomeMessage(String fullName, String username, String password, String roleName) {
        StringBuilder message = new StringBuilder();
        message.append("🎉 *Selamat Datang di PEPY Application!*\n\n");
        message.append("Halo *").append(fullName).append("*,\n\n");
        message.append("Anda telah berhasil diundang sebagai *").append(roleName).append("* di aplikasi PEPY.\n\n");
        message.append("📝 *Informasi Login Anda:*\n");
        message.append("Username: `").append(username).append("`\n");
        message.append("Password: `").append(password).append("`\n\n");
        message.append("🔗 *Link Aplikasi:*\n");
        message.append(appBaseUrl).append("\n\n");
        message.append("⚠️ *Penting:*\n");
        message.append("- Harap ganti password Anda setelah login pertama kali\n");
        message.append("- Jangan bagikan informasi login Anda kepada siapapun\n\n");
        message.append("Jika ada pertanyaan, silakan hubungi administrator.\n\n");
        message.append("Terima kasih! 🙏");
        
        return message.toString();
    }
    
    /**
     * Send WhatsApp message via Fonnte API
     */
    private void sendWhatsAppMessage(String phoneNumber, String message) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", fonnteToken);
            
            Map<String, String> body = new HashMap<>();
            body.put("target", phoneNumber);
            body.put("message", message);
            body.put("countryCode", "62"); // Indonesia country code
            
            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                fonnteApiUrl,
                HttpMethod.POST,
                request,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("WhatsApp message sent successfully to {}", phoneNumber);
            } else {
                log.warn("Failed to send WhatsApp message. Status: {}, Response: {}", 
                    response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("Error sending WhatsApp message to {}: {}", phoneNumber, e.getMessage());
            throw new RuntimeException("Failed to send WhatsApp message", e);
        }
    }
    
    /**
     * Send test WhatsApp message (for testing purposes)
     */
    public boolean sendTestMessage(String phoneNumber, String message) {
        try {
            String formattedPhone = formatPhoneNumber(phoneNumber);
            sendWhatsAppMessage(formattedPhone, message);
            return true;
        } catch (Exception e) {
            log.error("Failed to send test message: {}", e.getMessage());
            return false;
        }
    }
}
