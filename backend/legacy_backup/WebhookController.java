package com.shadcn.backend.controller;

import com.shadcn.backend.service.DonationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/webhook")
public class WebhookController {

    @Autowired
    private DonationService donationService;

    @PostMapping("/midtrans")
    public ResponseEntity<String> handleMidtransNotification(@RequestBody Map<String, Object> notification) {
        try {
            donationService.handleMidtransNotification(notification);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error processing notification");
        }
    }

    @PostMapping("/verify-payments")
    public ResponseEntity<String> verifyPendingPayments() {
        try {
            donationService.verifyPendingPayments();
            return ResponseEntity.ok("Payment verification completed");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error verifying payments");
        }
    }
}