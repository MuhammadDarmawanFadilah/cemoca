package com.shadcn.backend.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Utility class for encrypting and decrypting video link tokens
 * Uses AES-GCM encryption for secure link generation
 */
public class VideoLinkEncryptor {
    private static final Logger logger = LoggerFactory.getLogger(VideoLinkEncryptor.class);
    
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    
    // Secret key - should be stored in environment variable in production
    private static final String SECRET_KEY = "CEMOCAPPS_VIDEO_SECRET_KEY_2025!";

    private static final String BASE62_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    public static String encryptVideoLinkShort(Long reportId, Long itemId) {
        if (reportId == null || itemId == null) {
            return null;
        }
        if (reportId < 0 || itemId < 0) {
            return null;
        }

        return "r" + toBase62(reportId) + "i" + toBase62(itemId);
    }

    private static String toBase62(long value) {
        if (value == 0) {
            return "0";
        }
        StringBuilder sb = new StringBuilder();
        long v = value;
        while (v > 0) {
            int idx = (int) (v % 62);
            sb.append(BASE62_ALPHABET.charAt(idx));
            v = v / 62;
        }
        return sb.reverse().toString();
    }

    private static long fromBase62(String s) {
        if (s == null || s.isBlank()) {
            throw new IllegalArgumentException("empty");
        }
        long value = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            int idx = BASE62_ALPHABET.indexOf(c);
            if (idx < 0) {
                throw new IllegalArgumentException("invalid char");
            }
            value = (value * 62) + idx;
        }
        return value;
    }
    
    /**
     * Encrypt video item ID and report ID to create a shareable token
     * Format: reportId:itemId:timestamp
     */
    public static String encryptVideoLink(Long reportId, Long itemId) {
        try {
            String payload = reportId + ":" + itemId + ":" + System.currentTimeMillis();
            
            // Generate random IV
            byte[] iv = new byte[GCM_IV_LENGTH];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);
            
            // Create cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(
                SECRET_KEY.substring(0, 32).getBytes(StandardCharsets.UTF_8), 
                "AES"
            );
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec);
            
            // Encrypt
            byte[] encrypted = cipher.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            
            // Combine IV + encrypted data
            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);
            
            // Encode to URL-safe Base64
            return Base64.getUrlEncoder().withoutPadding().encodeToString(combined);
            
        } catch (Exception e) {
            logger.error("Error encrypting video link: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Decrypt token to get report ID and item ID
     * Returns array: [reportId, itemId] or null if invalid
     */
    public static Long[] decryptVideoLink(String token) {
        try {
            if (token != null) {
                String t = token.trim();
                if (t.startsWith("r") && t.contains("i")) {
                    int iPos = t.indexOf('i');
                    if (iPos > 1 && iPos < t.length() - 1) {
                        String rPart = t.substring(1, iPos);
                        String iPart = t.substring(iPos + 1);
                        long reportId = fromBase62(rPart);
                        long itemId = fromBase62(iPart);
                        return new Long[] { reportId, itemId };
                    }
                }
            }

            // Decode from URL-safe Base64
            byte[] combined = Base64.getUrlDecoder().decode(token);
            
            // Extract IV and encrypted data
            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] encrypted = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH);
            System.arraycopy(combined, GCM_IV_LENGTH, encrypted, 0, encrypted.length);
            
            // Create cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(
                SECRET_KEY.substring(0, 32).getBytes(StandardCharsets.UTF_8), 
                "AES"
            );
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec);
            
            // Decrypt
            byte[] decrypted = cipher.doFinal(encrypted);
            String payload = new String(decrypted, StandardCharsets.UTF_8);
            
            // Parse payload: reportId:itemId:timestamp
            String[] parts = payload.split(":");
            if (parts.length >= 2) {
                Long reportId = Long.parseLong(parts[0]);
                Long itemId = Long.parseLong(parts[1]);
                
                // Optional: Check timestamp for expiry (e.g., 30 days)
                if (parts.length >= 3) {
                    long timestamp = Long.parseLong(parts[2]);
                    long now = System.currentTimeMillis();
                    long thirtyDaysMs = 30L * 24 * 60 * 60 * 1000;
                    if (now - timestamp > thirtyDaysMs) {
                        logger.warn("Video link token expired");
                        return null;
                    }
                }
                
                return new Long[] { reportId, itemId };
            }
            
            return null;
            
        } catch (Exception e) {
            logger.error("Error decrypting video link: {}", e.getMessage());
            return null;
        }
    }
}
