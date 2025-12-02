package com.shadcn.backend.service;

import com.shadcn.backend.model.Payment;
import com.shadcn.backend.model.User;
import com.shadcn.backend.entity.MidtransConfig;
import com.shadcn.backend.repository.PaymentRepository;
import com.shadcn.backend.repository.UserRepository;
import com.shadcn.backend.service.MidtransConfigService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.Arrays;

@Service
public class DonationService {
    
    private static final Logger logger = LoggerFactory.getLogger(DonationService.class);
    
    @Autowired
    private MidtransConfigService midtransConfigService;
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private WhatsAppService whatsAppService;
    
    @Value("${whatsapp.api.enabled:false}")
    private boolean whatsappEnabled;
    
    /**
     * Create payment transaction based on payment method (DIRECT, LINK, WHATSAPP)
     */
    public Map<String, Object> createPayment(String donorName, String phoneNumber, 
                                            BigDecimal amount, String paymentMethod, 
                                            boolean isAnonymous) {
        try {
            // Get Midtrans configuration
            MidtransConfig config = midtransConfigService.getActiveConfig();
            
            // Generate unique order ID
            String orderId = "DONATION-" + System.currentTimeMillis();
            
            // Create payment record
            Payment payment = new Payment();
            payment.setPaymentId(orderId);
            payment.setAmount(amount);
            payment.setStatus(Payment.PaymentStatus.PENDING);
            payment.setMethod(Payment.PaymentMethod.BANK_TRANSFER);
            String donorDisplayName = isAnonymous ? "Anonim" : (donorName != null ? donorName : "Anonim");
            payment.setDescription("Donasi dari " + donorDisplayName);
            payment.setCategory(Payment.PaymentCategory.OTHER);
            payment.setCreatedAt(LocalDateTime.now());
            payment.setUpdatedAt(LocalDateTime.now());
            
            // Save payment
            paymentRepository.save(payment);
            
            // Prepare request body for Midtrans
            Map<String, Object> requestBody = new HashMap<>();
            
            // Transaction details
            Map<String, Object> transactionDetails = new HashMap<>();
            transactionDetails.put("order_id", orderId);
            transactionDetails.put("gross_amount", amount.intValue());
            requestBody.put("transaction_details", transactionDetails);
            
            // Customer details
            Map<String, Object> customerDetails = new HashMap<>();
            String firstName = isAnonymous ? "Anonim" : (donorName != null ? donorName : "Anonim");
            customerDetails.put("first_name", firstName);
            if (phoneNumber != null && !phoneNumber.trim().isEmpty()) {
                customerDetails.put("phone", phoneNumber);
            }
            requestBody.put("customer_details", customerDetails);
            
            requestBody.put("item_details", List.of(Map.of(
                "id", "donation",
                "price", amount.intValue(),
                "quantity", 1,
                "name", "Dukung Pengembang"
            )));
            
            // Set all payment methods
            requestBody.put("enabled_payments", List.of(
                "other_qris", "qris", "bca_va", "bni_va", "bri_va", "permata_va", "other_va", 
                "echannel", "credit_card", "gopay", "shopeepay", "indomaret", "alfamart", "akulaku"
            ));
            
            // Add redirect URLs for payment notification
            Map<String, Object> callbacks = new HashMap<>();
            String baseUrl = config.getIsProduction() ? "https://yourdomain.com" : "http://localhost:3000";
            callbacks.put("finish", baseUrl + "/payment-notification?status=success&transaction_id=" + orderId + "&amount=" + amount.intValue() + "&donor_name=" + (isAnonymous ? "Anonim" : (donorName != null ? donorName : "Anonim")));
            callbacks.put("unfinish", baseUrl + "/payment-notification?status=pending&transaction_id=" + orderId);
            callbacks.put("error", baseUrl + "/payment-notification?status=failed&transaction_id=" + orderId);
            requestBody.put("callbacks", callbacks);
            
            // Create HTTP headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Basic " + 
                Base64.getEncoder().encodeToString((config.getServerKey() + ":").getBytes()));
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            // Call Midtrans API
            ResponseEntity<Map> response = restTemplate.postForEntity(
                config.getSnapUrl(), entity, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED) {
                Map<String, Object> responseBody = response.getBody();
                
                // Update payment with transaction token
                payment.setTransactionId((String) responseBody.get("token"));
                paymentRepository.save(payment);
                
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("orderId", orderId);
                result.put("paymentMethod", paymentMethod);
                
                // Handle different payment methods
                switch (paymentMethod.toUpperCase()) {
                    case "DIRECT":
                        // For direct payment, return snap token for popup
                        result.put("snapToken", responseBody.get("token"));
                        logger.info("Direct payment created for order {}", orderId);
                        break;
                        
                    case "LINK":
                        // For link payment, return payment URL
                        result.put("paymentUrl", responseBody.get("redirect_url"));
                        logger.info("Link payment created for order {}", orderId);
                        break;
                        
                    case "WHATSAPP":
                        // For WhatsApp payment, send link via WhatsApp
                        result.put("paymentUrl", responseBody.get("redirect_url"));
                        
                        if (whatsappEnabled && phoneNumber != null && !phoneNumber.trim().isEmpty()) {
                            try {
                                String paymentUrl = (String) responseBody.get("redirect_url");
                                String whatsappDonorName = isAnonymous ? "Anonim" : (donorName != null ? donorName : "Anonim");
                                
                                // Format phone number for WhatsApp
                                String formattedPhone = formatPhoneNumberForWhatsApp(phoneNumber);
                                
                                String whatsappMessage = buildPaymentMessage(whatsappDonorName, amount, paymentUrl, orderId);
                                String messageId = whatsAppService.sendMessage(formattedPhone, whatsappMessage);
                                
                                result.put("whatsappSent", true);
                                result.put("whatsappMessageId", messageId);
                                
                                logger.info("WhatsApp payment notification sent to {} for order {}", formattedPhone, orderId);
                            } catch (Exception e) {
                                logger.error("Failed to send WhatsApp payment notification for order {}: {}", orderId, e.getMessage());
                                result.put("whatsappSent", false);
                                result.put("whatsappError", e.getMessage());
                            }
                        } else {
                            result.put("whatsappSent", false);
                            result.put("whatsappError", "WhatsApp service not enabled or phone number not provided");
                        }
                        
                        logger.info("WhatsApp payment created for order {}", orderId);
                        break;
                        
                    default:
                        logger.warn("Unknown payment method: {}, defaulting to direct", paymentMethod);
                        result.put("snapToken", responseBody.get("token"));
                        break;
                }
                
                return result;
            } else {
                throw new RuntimeException("Failed to create Midtrans transaction");
            }
            
        } catch (Exception e) {
            logger.error("Error creating payment transaction for method {}", paymentMethod, e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", e.getMessage());
            return result;
        }
    }
    
    public Map<String, Object> createDonationTransaction(String donorName, String phoneNumber, 
                                                         BigDecimal amount, String paymentType, 
                                                         boolean isAnonymous) {
        try {
            // Get Midtrans configuration
            MidtransConfig config = midtransConfigService.getActiveConfig();
            
            // Generate unique order ID
            String orderId = "DONATION-" + System.currentTimeMillis();
            
            // Create payment record
            Payment payment = new Payment();
            payment.setPaymentId(orderId);
            payment.setAmount(amount);
            payment.setStatus(Payment.PaymentStatus.PENDING);
            payment.setMethod(Payment.PaymentMethod.BANK_TRANSFER);
            String donorDisplayName = isAnonymous ? "Anonim" : (donorName != null ? donorName : "Anonim");
            payment.setDescription("Donasi dari " + donorDisplayName);
            payment.setCategory(Payment.PaymentCategory.OTHER);
            payment.setCreatedAt(LocalDateTime.now());
            payment.setUpdatedAt(LocalDateTime.now());
            
            // Save payment
            paymentRepository.save(payment);
            
            // Prepare request body for Midtrans
            Map<String, Object> requestBody = new HashMap<>();
            
            // Transaction details
            Map<String, Object> transactionDetails = new HashMap<>();
            transactionDetails.put("order_id", orderId);
            transactionDetails.put("gross_amount", amount.intValue());
            requestBody.put("transaction_details", transactionDetails);
            
            // Customer details
            Map<String, Object> customerDetails = new HashMap<>();
            String firstName = isAnonymous ? "Anonim" : (donorName != null ? donorName : "Anonim");
            customerDetails.put("first_name", firstName);
            if (phoneNumber != null && !phoneNumber.trim().isEmpty()) {
                customerDetails.put("phone", phoneNumber);
            }
            requestBody.put("customer_details", customerDetails);
            
            requestBody.put("item_details", List.of(Map.of(
                "id", "donation",
                "price", amount.intValue(),
                "quantity", 1,
                "name", "Dukung Pengembang"
            )));
            
            // Set all payment methods for all payment types
            requestBody.put("enabled_payments", List.of(
                 "other_qris","qris", "bca_va", "bni_va", "bri_va", "permata_va", "other_va", "echannel", "credit_card", "gopay", "shopeepay",            
                "indomaret", "alfamart", "akulaku"
            ));
            
            // Add redirect URLs for payment notification
            Map<String, Object> callbacks = new HashMap<>();
            String baseUrl = config.getIsProduction() ? "https://yourdomain.com" : "http://localhost:3000";
            callbacks.put("finish", baseUrl + "/payment-notification?status=success&transaction_id=" + orderId + "&amount=" + amount.intValue() + "&donor_name=" + (isAnonymous ? "Anonim" : (donorName != null ? donorName : "Anonim")));
            callbacks.put("unfinish", baseUrl + "/payment-notification?status=pending&transaction_id=" + orderId);
            callbacks.put("error", baseUrl + "/payment-notification?status=failed&transaction_id=" + orderId);
            requestBody.put("callbacks", callbacks);
            
            // Create HTTP headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Basic " + 
                Base64.getEncoder().encodeToString((config.getServerKey() + ":").getBytes()));
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            // Call Midtrans API
            ResponseEntity<Map> response = restTemplate.postForEntity(
                config.getSnapUrl(), entity, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED) {
                Map<String, Object> responseBody = response.getBody();
                
                // Update payment with transaction token
                payment.setTransactionId((String) responseBody.get("token"));
                paymentRepository.save(payment);
                
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("orderId", orderId);
                result.put("snapToken", responseBody.get("token"));
                result.put("paymentUrl", responseBody.get("redirect_url"));
                result.put("paymentType", paymentType);
                
                // Handle WhatsApp payment method
                if ("WHATSAPP".equals(paymentType) && whatsappEnabled && phoneNumber != null && !phoneNumber.trim().isEmpty()) {
                    try {
                        String paymentUrl = (String) responseBody.get("redirect_url");
                        String whatsappDonorName = isAnonymous ? "Anonim" : (donorName != null ? donorName : "Anonim");
                        
                        // Fix phone number format: 085 -> 6285
                        String formattedPhone = formatPhoneNumberForWhatsApp(phoneNumber);
                        
                        String whatsappMessage = buildPaymentMessage(whatsappDonorName, amount, paymentUrl, orderId);
                        String messageId = whatsAppService.sendMessage(formattedPhone, whatsappMessage);
                        
                        result.put("whatsappSent", true);
                        result.put("whatsappMessageId", messageId);
                        result.put("paymentUrl", paymentUrl);
                        
                        logger.info("WhatsApp payment notification sent to {} for order {}", formattedPhone, orderId);
                    } catch (Exception e) {
                        logger.error("Failed to send WhatsApp payment notification for order {}: {}", orderId, e.getMessage());
                        result.put("whatsappSent", false);
                        result.put("whatsappError", e.getMessage());
                        // Still return success for payment creation, WhatsApp is optional
                    }
                }
                
                return result;
            } else {
                throw new RuntimeException("Failed to create Midtrans transaction");
            }
            
        } catch (Exception e) {
            logger.error("Error creating donation transaction", e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", e.getMessage());
            return result;
        }
    }
    
    public Map<String, Object> checkPaymentStatus(String orderId) {
        try {
            // Get Midtrans configuration
            MidtransConfig config = midtransConfigService.getActiveConfig();
            
            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Basic " + 
                Base64.getEncoder().encodeToString((config.getServerKey() + ":").getBytes()));
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                config.getApiUrl() + "/" + orderId + "/status", 
                HttpMethod.GET, 
                entity, 
                Map.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> responseBody = response.getBody();
                if (responseBody == null) {
                    logger.warn("Response body is null for order: {}", orderId);
                    throw new RuntimeException("Empty response from Midtrans API");
                }
                String transactionStatus = (String) responseBody.get("transaction_status");
                
                // Update payment status
                Optional<Payment> paymentOpt = paymentRepository.findByPaymentId(orderId);
                if (paymentOpt.isPresent()) {
                    Payment payment = paymentOpt.get();
                    
                    // Check if transactionStatus is not null before using in switch
                    if (transactionStatus != null) {
                        switch (transactionStatus) {
                            case "capture":
                            case "settlement":
                                payment.setStatus(Payment.PaymentStatus.SUCCESS);
                                break;
                            case "pending":
                                payment.setStatus(Payment.PaymentStatus.PENDING);
                                break;
                            case "deny":
                            case "cancel":
                            case "expire":
                                payment.setStatus(Payment.PaymentStatus.FAILED);
                                break;
                            default:
                                logger.warn("Unknown transaction status: {} for order: {}", transactionStatus, orderId);
                                break;
                        }
                    } else {
                        logger.warn("Transaction status is null for order: {}", orderId);
                        // Keep current status if transaction status is null
                    }
                    
                    payment.setUpdatedAt(LocalDateTime.now());
                    paymentRepository.save(payment);
                }
                
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("status", transactionStatus != null ? transactionStatus : "unknown");
                result.put("orderId", orderId);
                
                return result;
            } else {
                throw new RuntimeException("Failed to check payment status");
            }
            
        } catch (Exception e) {
            logger.error("Error checking payment status for order: " + orderId, e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", e.getMessage());
            return result;
        }
    }
    
    public List<Map<String, Object>> getTopDonors(int limit) {
        try {
            List<Payment> successfulPayments = paymentRepository.findByStatus(Payment.PaymentStatus.SUCCESS);
            
            Map<String, BigDecimal> donorTotals = new HashMap<>();
            
            for (Payment payment : successfulPayments) {
                String donorName = payment.getDescription().replace("Donasi dari ", "");
                donorTotals.merge(donorName, payment.getAmount(), BigDecimal::add);
            }
            
            List<Map<String, Object>> topDonors = new ArrayList<>();
            donorTotals.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .limit(limit)
                .forEach(entry -> {
                    Map<String, Object> donor = new HashMap<>();
                    donor.put("donorName", entry.getKey());
                    donor.put("totalAmount", entry.getValue());
                    topDonors.add(donor);
                });
            
            return topDonors;
            
        } catch (Exception e) {
            logger.error("Error getting top donors", e);
            return new ArrayList<>();
        }
    }
    
    public Map<String, Object> getDonationStats() {
        try {
            List<Payment> successfulPayments = paymentRepository.findByStatus(Payment.PaymentStatus.SUCCESS);
            
            BigDecimal totalAmount = successfulPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            int totalDonors = successfulPayments.size();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalAmount", totalAmount);
            stats.put("totalDonors", totalDonors);
            
            return stats;
            
        } catch (Exception e) {
            logger.error("Error getting donation stats", e);
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalAmount", BigDecimal.ZERO);
            stats.put("totalDonors", 0);
            return stats;
        }
    }
    
    public List<Map<String, Object>> getSuccessfulDonations() {
        try {
            List<Payment> successfulPayments = paymentRepository.findByStatus(Payment.PaymentStatus.SUCCESS);
            
            List<Map<String, Object>> donations = new ArrayList<>();
            
            for (Payment payment : successfulPayments) {
                Map<String, Object> donation = new HashMap<>();
                donation.put("id", payment.getPaymentId());
                donation.put("donorName", payment.getDescription().replace("Donasi dari ", ""));
                donation.put("amount", payment.getAmount());
                donation.put("date", payment.getCreatedAt());
                donation.put("status", payment.getStatus().toString());
                donations.add(donation);
            }
            
            // Sort by amount in descending order (highest first)
            donations.sort((a, b) -> {
                BigDecimal amountA = (BigDecimal) a.get("amount");
                BigDecimal amountB = (BigDecimal) b.get("amount");
                return amountB.compareTo(amountA);
            });
            
            return donations;
            
        } catch (Exception e) {
            logger.error("Error getting successful donations", e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Get top individual donations (not grouped by donor name)
     */
    public List<Map<String, Object>> getTopIndividualDonations(int limit) {
        try {
            List<Payment> successfulPayments = paymentRepository.findByStatus(Payment.PaymentStatus.SUCCESS);
            
            List<Map<String, Object>> donations = new ArrayList<>();
            
            for (Payment payment : successfulPayments) {
                Map<String, Object> donation = new HashMap<>();
                donation.put("id", payment.getPaymentId());
                donation.put("donorName", payment.getDescription().replace("Donasi dari ", ""));
                donation.put("amount", payment.getAmount());
                donation.put("date", payment.getCreatedAt());
                donation.put("status", payment.getStatus().toString());
                donations.add(donation);
            }
            
            // Sort by amount in descending order (highest first) and limit
            return donations.stream()
                .sorted((a, b) -> {
                    BigDecimal amountA = (BigDecimal) a.get("amount");
                    BigDecimal amountB = (BigDecimal) b.get("amount");
                    return amountB.compareTo(amountA);
                })
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());
            
        } catch (Exception e) {
            logger.error("Error getting top individual donations", e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Format phone number for WhatsApp: 085 -> +6285
     */
    private String formatPhoneNumberForWhatsApp(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return phoneNumber;
        }
        
        // Clean phone number (remove non-digits except +)
        String cleaned = phoneNumber.replaceAll("[^+\\d]", "");
        
        if (!cleaned.startsWith("+")) {
            // Assume Indonesian number if no country code
            if (cleaned.startsWith("0")) {
                cleaned = "+62" + cleaned.substring(1);
            } else if (cleaned.startsWith("62")) {
                cleaned = "+" + cleaned;
            } else {
                cleaned = "+62" + cleaned;
            }
        }
        
        return cleaned;
    }
    
    /**
     * Handle Midtrans webhook notification
     */
    public void handleMidtransNotification(Map<String, Object> notification) {
        try {
            // Get Midtrans configuration
            MidtransConfig config = midtransConfigService.getActiveConfig();
            
            String orderId = (String) notification.get("order_id");
            String transactionStatus = (String) notification.get("transaction_status");
            String fraudStatus = (String) notification.get("fraud_status");
            String signatureKey = (String) notification.get("signature_key");
            String statusCode = (String) notification.get("status_code");
            String grossAmount = (String) notification.get("gross_amount");
            
            // Validate required parameters
            if (orderId == null || signatureKey == null || statusCode == null || grossAmount == null) {
                logger.warn("Missing required parameters in webhook notification");
                return;
            }
            
            // Verify signature
            String expectedSignature = generateSignature(orderId, statusCode, grossAmount, config);
            if (!signatureKey.equals(expectedSignature)) {
                logger.warn("Invalid signature for order {}: expected {}, got {}", orderId, expectedSignature, signatureKey);
                return;
            }
            
            // Update payment status
            Optional<Payment> paymentOpt = paymentRepository.findByPaymentId(orderId);
            if (paymentOpt.isPresent()) {
                Payment payment = paymentOpt.get();
                
                // Check for successful payment
                if ("200".equals(statusCode) && "accept".equals(fraudStatus) && 
                    transactionStatus != null && ("capture".equals(transactionStatus) || "settlement".equals(transactionStatus))) {
                    payment.setStatus(Payment.PaymentStatus.SUCCESS);
                    logger.info("Payment {} marked as SUCCESS via webhook", orderId);
                } else if ("pending".equals(transactionStatus)) {
                    payment.setStatus(Payment.PaymentStatus.PENDING);
                } else {
                    payment.setStatus(Payment.PaymentStatus.FAILED);
                    logger.info("Payment {} marked as FAILED via webhook: status={}, fraud={}", 
                        orderId, transactionStatus, fraudStatus);
                }
                
                payment.setUpdatedAt(LocalDateTime.now());
                paymentRepository.save(payment);
                
                logger.info("Successfully processed webhook for order {}: status={}", orderId, transactionStatus);
            } else {
                logger.warn("Payment not found for order {}", orderId);
            }
            
        } catch (Exception e) {
            logger.error("Error handling Midtrans notification", e);
        }
    }
    
    /**
     * Generate signature for verification
     */
    private String generateSignature(String orderId, String statusCode, String grossAmount, MidtransConfig config) {
        try {
            // Validate parameters
            if (orderId == null || statusCode == null || grossAmount == null || config.getServerKey() == null) {
                logger.warn("Cannot generate signature: null parameters detected");
                return "";
            }
            
            String input = orderId + statusCode + grossAmount + config.getServerKey();
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-512");
            byte[] hash = md.digest(input.getBytes("UTF-8"));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            logger.error("Error generating signature", e);
            return "";
        }
    }
    
    @Value("${payment.verification.scheduler.max-age-hours:24}")
    private int maxAgeHours;
    
    @Value("${payment.verification.scheduler.enabled:true}")
    private boolean schedulerEnabled;

    /**
     * Verify payments that are pending, failed, or unverified
     * Runs based on cron expression defined in properties (default: every 12 hours at 8:00 and 20:00)
     */
    @Scheduled(cron = "${payment.verification.scheduler.cron:0 0 8,20 * * *}", zone = "${payment.verification.scheduler.timezone:Asia/Jakarta}")
    public void verifyPendingPayments() {
        if (!schedulerEnabled) {
            logger.debug("Payment verification scheduler is disabled");
            return;
        }
        
        try {
            // Get Midtrans configuration
            MidtransConfig config = midtransConfigService.getActiveConfig();
            
            List<Payment> pendingPayments = paymentRepository.findByStatusIn(
                Arrays.asList(Payment.PaymentStatus.PENDING, Payment.PaymentStatus.FAILED)
            );
            
            logger.info("Starting verification of {} pending/failed payments (max age: {} hours)", 
                pendingPayments.size(), maxAgeHours);
            
            int verifiedCount = 0;
            int skippedCount = 0;
            
            for (Payment payment : pendingPayments) {
                try {
                    // Skip if payment is older than configured max age
                    if (payment.getCreatedAt().isBefore(LocalDateTime.now().minusHours(maxAgeHours))) {
                        skippedCount++;
                        logger.debug("Skipping payment {} - older than {} hours", 
                            payment.getPaymentId(), maxAgeHours);
                        continue;
                    }
                    
                    // Set headers for API call
                    HttpHeaders headers = new HttpHeaders();
                    headers.set("Authorization", "Basic " + 
                        Base64.getEncoder().encodeToString((config.getServerKey() + ":").getBytes()));
                    
                    HttpEntity<String> entity = new HttpEntity<>(headers);
                    
                    // Call Midtrans API to check status
                    ResponseEntity<Map> response = restTemplate.exchange(
                        config.getApiUrl() + "/" + payment.getPaymentId() + "/status",
                        HttpMethod.GET,
                        entity,
                        Map.class
                    );
                    
                    if (response.getStatusCode() == HttpStatus.OK) {
                        Map<String, Object> responseBody = response.getBody();
                        if (responseBody != null) {
                            String transactionStatus = (String) responseBody.get("transaction_status");
                            
                            // Update payment status based on Midtrans response
                            if (transactionStatus != null) {
                                switch (transactionStatus) {
                                    case "capture":
                                    case "settlement":
                                        payment.setStatus(Payment.PaymentStatus.SUCCESS);
                                        break;
                                    case "pending":
                                        payment.setStatus(Payment.PaymentStatus.PENDING);
                                        break;
                                    case "deny":
                                    case "cancel":
                                    case "expire":
                                        payment.setStatus(Payment.PaymentStatus.FAILED);
                                        break;
                                    default:
                                        logger.warn("Unknown transaction status: {} for payment: {}", 
                                            transactionStatus, payment.getPaymentId());
                                        break;
                                }
                                
                                payment.setUpdatedAt(LocalDateTime.now());
                                paymentRepository.save(payment);
                                
                                verifiedCount++;
                                logger.info("Verified payment {} status: {}", 
                                    payment.getPaymentId(), transactionStatus);
                            }
                        }
                    }
                    
                    // Add delay to avoid rate limiting
                    Thread.sleep(1000);
                    
                } catch (Exception e) {
                    logger.error("Error verifying payment {}: {}", payment.getPaymentId(), e.getMessage());
                }
            }
            
            logger.info("Completed payment verification job - verified: {}, skipped: {}", 
                verifiedCount, skippedCount);
            
        } catch (Exception e) {
            logger.error("Error in payment verification job", e);
        }
    }
    
    /**
     * Build WhatsApp payment message content
     */
    private String buildPaymentMessage(String donorName, BigDecimal amount, String paymentUrl, String orderId) {
        return String.format(
            "*💰 Konfirmasi Dukung Pengembang 💰*\n\n" +
            "Halo %s!\n\n" +
            "Terima kasih atas niat baik Anda untuk mendukung pengembangan aplikasi.\n\n" +
            "📋 *Detail Dukungan:*\n" +
            "• Nama: %s\n" +
            "• Jumlah: Rp %s\n" +
            "• Order ID: %s\n\n" +
            "💳 *Link Pembayaran:*\n" +
            "%s\n\n" +
            "📝 *Petunjuk:*\n" +
            "1. Klik link di atas untuk melakukan pembayaran\n" +
            "2. Pilih metode pembayaran yang Anda inginkan\n" +
            "3. Ikuti instruksi pembayaran\n" +
            "4. Simpan bukti pembayaran\n\n" +
            "⏰ Link pembayaran berlaku selama 24 jam.\n\n" +
            "Terima kasih atas dukungan Anda! 🙏\n\n" +
            "_Pesan ini dikirim otomatis oleh sistem Alumni._",
            donorName, donorName, 
            new java.text.DecimalFormat("#,###").format(amount),
            orderId, paymentUrl
        );
    }
}