package com.shadcn.backend.scheduler;

import com.shadcn.backend.service.DonationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "payment.verification.scheduler.enabled", havingValue = "true", matchIfMissing = false)
public class PaymentVerificationScheduler {

    private static final Logger logger = LoggerFactory.getLogger(PaymentVerificationScheduler.class);

    @Autowired
    private DonationService donationService;

    /**
     * Scheduled payment verification using cron expression
     * Default: daily at 8:00 AM Jakarta time
     */
    @Scheduled(cron = "${payment.verification.scheduler.cron:0 0 8 * * *}", 
               zone = "${payment.verification.scheduler.timezone:Asia/Jakarta}")
    public void verifyPendingPayments() {
        try {
            logger.info("Starting scheduled payment verification (daily at 8:00 AM)");
            donationService.verifyPendingPayments();
            logger.info("Scheduled payment verification completed successfully");
        } catch (Exception e) {
            logger.error("Error during scheduled payment verification: {}", e.getMessage(), e);
        }
    }
}