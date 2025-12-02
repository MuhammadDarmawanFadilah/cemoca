package com.shadcn.backend.controller;

import com.shadcn.backend.service.DonationService;
import com.shadcn.backend.service.MidtransConfigService;
import com.shadcn.backend.entity.MidtransConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/donations")
@CrossOrigin(origins = "${cors.allowed-origins}")
public class DonationController {
    
    private static final Logger logger = LoggerFactory.getLogger(DonationController.class);
    
    @Autowired
    private DonationService donationService;
    
    @Autowired
    private MidtransConfigService midtransConfigService;
    
    /**
     * Get Midtrans client key for frontend
     */
    @GetMapping("/midtrans-config")
    public ResponseEntity<Map<String, Object>> getMidtransConfig() {
        try {
            MidtransConfig config = midtransConfigService.getActiveConfig();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "clientKey", config.getClientKey(),
                    "isProduction", config.getIsProduction()
                )
            ));
        } catch (Exception e) {
            logger.error("Error getting Midtrans config", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Gagal mendapatkan konfigurasi Midtrans"
            ));
        }
    }
    
    /**
     * Create direct payment for donation
     */
    @PostMapping("/create-direct-payment")
    public ResponseEntity<Map<String, Object>> createDirectPayment(
            @RequestBody Map<String, Object> request) {
        
        logger.info("Creating direct payment with request: {}", request);
        
        try {
            String donorName = (String) request.get("donorName");
            String phoneNumber = (String) request.get("phoneNumber");
            BigDecimal amount = new BigDecimal(request.get("amount").toString());
            Boolean isAnonymous = (Boolean) request.get("isAnonymous");
            
            if (isAnonymous == null) {
                isAnonymous = false;
            }
            
            Map<String, Object> result = donationService.createDonationTransaction(
                donorName, phoneNumber, amount, "DIRECT", isAnonymous
            );
            
            logger.info("Direct payment creation result: {}", result);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("Error creating direct payment", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/create-payment")
    public ResponseEntity<Map<String, Object>> createDonationPayment(
            @RequestBody Map<String, Object> request) {
        
        logger.info("Creating donation payment with request: {}", request);
        
        try {
            String donorName = (String) request.get("name");
            String phoneNumber = (String) request.get("phoneNumber");
            BigDecimal amount = new BigDecimal(request.get("amount").toString());
            String paymentMethod = (String) request.get("paymentMethod");
            Boolean isAnonymous = (Boolean) request.get("isAnonymous");
            
            // Validate required fields
            if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Amount must be greater than 0"
                ));
            }
            
            if (paymentMethod == null || paymentMethod.trim().isEmpty()) {
                paymentMethod = "direct"; // Default to direct payment
            }
            
            if (isAnonymous == null) {
                isAnonymous = false;
            }
            
            // Use the new createPayment method that handles all three payment methods
            Map<String, Object> result = donationService.createPayment(
                donorName, phoneNumber, amount, paymentMethod, isAnonymous
            );
            
            logger.info("Donation payment creation result: {}", result);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("Error creating donation payment", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/verify-payment/{orderId}")
    public ResponseEntity<Map<String, Object>> verifyPayment(@PathVariable String orderId) {
        
        logger.info("Verifying payment for order: {}", orderId);
        
        try {
            Map<String, Object> result = donationService.checkPaymentStatus(orderId);
            logger.info("Payment verification result for {}: {}", orderId, result);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("Error verifying payment for order: " + orderId, e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/top-donors")
    public ResponseEntity<List<Map<String, Object>>> getTopDonors(
            @RequestParam(defaultValue = "10") int limit) {
        
        logger.info("Getting top {} donors", limit);
        
        try {
            List<Map<String, Object>> topDonors = donationService.getTopDonors(limit);
            logger.info("Found {} top donors", topDonors.size());
            return ResponseEntity.ok(topDonors);
            
        } catch (Exception e) {
            logger.error("Error getting top donors", e);
            return ResponseEntity.badRequest().body(List.of());
        }
    }
    
    @GetMapping("/top-individual-donations")
    public ResponseEntity<List<Map<String, Object>>> getTopIndividualDonations(
            @RequestParam(defaultValue = "10") int limit) {
        
        logger.info("Getting top {} individual donations", limit);
        
        try {
            List<Map<String, Object>> topDonations = donationService.getTopIndividualDonations(limit);
            logger.info("Found {} top individual donations", topDonations.size());
            return ResponseEntity.ok(topDonations);
            
        } catch (Exception e) {
            logger.error("Error getting top individual donations", e);
            return ResponseEntity.badRequest().body(List.of());
        }
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDonationStats() {
        
        logger.info("Getting donation statistics");
        
        try {
            Map<String, Object> stats = donationService.getDonationStats();
            logger.info("Donation stats: {}", stats);
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            logger.error("Error getting donation stats", e);
            return ResponseEntity.badRequest().body(Map.of(
                "totalAmount", 0,
                "totalDonors", 0
            ));
        }
    }
    
    @GetMapping("/successful")
    public ResponseEntity<List<Map<String, Object>>> getSuccessfulDonations() {
        
        logger.info("Getting all successful donations");
        
        try {
            List<Map<String, Object>> successfulDonations = donationService.getSuccessfulDonations();
            logger.info("Found {} successful donations", successfulDonations.size());
            return ResponseEntity.ok(successfulDonations);
            
        } catch (Exception e) {
            logger.error("Error getting successful donations", e);
            return ResponseEntity.badRequest().body(List.of());
        }
    }
    
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(@RequestBody Map<String, Object> notification) {
        
        logger.info("Received Midtrans webhook: {}", notification);
        
        try {
            String orderId = (String) notification.get("order_id");
            String transactionStatus = (String) notification.get("transaction_status");
            
            // Verify payment status
            donationService.checkPaymentStatus(orderId);
            
            logger.info("Webhook processed successfully for order: {}", orderId);
            return ResponseEntity.ok("OK");
            
        } catch (Exception e) {
            logger.error("Error processing webhook", e);
            return ResponseEntity.badRequest().body("Error");
        }
    }
}