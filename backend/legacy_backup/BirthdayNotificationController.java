package com.shadcn.backend.controller;

import com.shadcn.backend.dto.*;
import com.shadcn.backend.model.BirthdayNotification;
import com.shadcn.backend.service.BirthdayNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/birthday")
@RequiredArgsConstructor
@Slf4j
public class BirthdayNotificationController {
    
    private final BirthdayNotificationService birthdayNotificationService;    @GetMapping("/notifications")
    public ResponseEntity<Page<BirthdayNotificationDTO>> getBirthdayNotifications(
            @RequestParam(required = false) Integer year,            @RequestParam(required = false) String alumniYear,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean isExcluded,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String startBirthDate,
            @RequestParam(required = false) String endBirthDate,
            @RequestParam(required = false) String nama,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "notificationDate") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {
        
        BirthdayNotificationFilter filter = new BirthdayNotificationFilter();
        filter.setYear(year != null ? year : LocalDate.now().getYear());
        filter.setAlumniYear(alumniYear);
        filter.setStatus(status);
        filter.setIsExcluded(isExcluded != null ? isExcluded.toString() : null);
        filter.setStartDate(startDate);
        filter.setEndDate(endDate);
        filter.setStartBirthDate(startBirthDate);
        filter.setEndBirthDate(endBirthDate);
        filter.setNama(nama);
        filter.setPage(page);
        filter.setSize(size);
        filter.setSortBy(sortBy);
        filter.setSortDirection(sortDirection);
        
        Page<BirthdayNotificationDTO> notifications = birthdayNotificationService
            .getBirthdayNotifications(filter);
        
        return ResponseEntity.ok(notifications);
    }
      @GetMapping("/upcoming")
    public ResponseEntity<List<BirthdayNotificationDTO>> getUpcomingBirthdays(
            @RequestParam(defaultValue = "30") Integer days) {
        
        List<BirthdayNotificationDTO> upcoming = birthdayNotificationService
            .getUpcomingBirthdaysFromBiografi(days);
        
        return ResponseEntity.ok(upcoming);
    }
    
    @GetMapping("/past")
    public ResponseEntity<List<BirthdayNotificationDTO>> getPastBirthdays(
            @RequestParam(defaultValue = "30") Integer days) {
        
        List<BirthdayNotificationDTO> past = birthdayNotificationService
            .getPastBirthdaysFromBiografi(days);
        
        return ResponseEntity.ok(past);
    }
    
    @GetMapping("/statistics")
    public ResponseEntity<BirthdayStatistics> getBirthdayStatistics(
            @RequestParam(required = false) Integer year) {
        
        Integer targetYear = year != null ? year : LocalDate.now().getYear();
        BirthdayStatistics statistics = birthdayNotificationService
            .getBirthdayStatistics(targetYear);
        
        return ResponseEntity.ok(statistics);
    }
    
    @PostMapping("/generate/{year}")
    public ResponseEntity<Map<String, String>> generateBirthdayNotifications(@PathVariable Integer year) {
        try {
            birthdayNotificationService.generateBirthdayNotificationsForYear(year);
            return ResponseEntity.ok(Map.of("message", "Birthday notifications generated successfully for year " + year));
        } catch (Exception e) {
            log.error("Error generating birthday notifications for year {}", year, e);
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to generate notifications: " + e.getMessage()));
        }
    }
    
    @PostMapping("/send-today")
    public ResponseEntity<Map<String, String>> sendTodayNotifications() {
        try {
            birthdayNotificationService.sendTodayBirthdayNotifications();
            return ResponseEntity.ok(Map.of("message", "Today's birthday notifications sent successfully"));
        } catch (Exception e) {
            log.error("Error sending today's birthday notifications", e);
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to send notifications: " + e.getMessage()));
        }
    }
    
    @PostMapping("/resend/{id}")
    public ResponseEntity<Map<String, String>> resendNotification(@PathVariable Long id) {
        try {
            birthdayNotificationService.resendBirthdayNotification(id);
            return ResponseEntity.ok(Map.of("message", "Birthday notification resent successfully"));
        } catch (Exception e) {
            log.error("Error resending birthday notification {}", id, e);
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to resend notification: " + e.getMessage()));
        }
    }
      @PutMapping("/exclude-biografi/{biografiId}")
    public ResponseEntity<Map<String, String>> excludeBiografiNotification(
            @PathVariable Long biografiId, 
            @RequestBody Map<String, Boolean> request) {
        
        try {
            Boolean exclude = request.getOrDefault("exclude", false);
            birthdayNotificationService.excludeBiografiBirthdayNotification(biografiId, exclude);
            
            String action = exclude ? "excluded from" : "included in";
            return ResponseEntity.ok(Map.of("message", 
                "Biografi notification " + action + " birthday notifications"));
        } catch (Exception e) {
            log.error("Error updating exclusion status for biografi {}", biografiId, e);
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to update biografi notification: " + e.getMessage()));
        }
    }
    
    @PutMapping("/reset-biografi-to-pending/{biografiId}")
    public ResponseEntity<Map<String, String>> resetBiografiNotificationToPending(@PathVariable Long biografiId) {
        try {
            birthdayNotificationService.resetBiografiNotificationToPending(biografiId);
            return ResponseEntity.ok(Map.of("message", "Biografi notification status reset to pending successfully"));
        } catch (Exception e) {
            log.error("Error resetting biografi notification {} to pending", biografiId, e);
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to reset biografi notification: " + e.getMessage()));
        }
    }
    
    @GetMapping("/settings")
    public ResponseEntity<BirthdaySettingsResponse> getBirthdaySettings() {
        BirthdaySettingsResponse settings = birthdayNotificationService.getBirthdaySettings();
        return ResponseEntity.ok(settings);
    }
    
    @PostMapping("/test/{biografiId}")
    public ResponseEntity<Map<String, String>> testBirthdayNotification(@PathVariable Long biografiId) {
        try {
            birthdayNotificationService.testBirthdayNotificationForBiografi(biografiId);
            return ResponseEntity.ok(Map.of("message", "Test birthday notification sent successfully"));
        } catch (Exception e) {
            log.error("Error sending test birthday notification for biografi {}", biografiId, e);
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to send test notification: " + e.getMessage()));
        }
    }
    
    @GetMapping("/test-today")
    public ResponseEntity<Map<String, Object>> testTodayBirthdays() {
        LocalDate today = LocalDate.now();
        Map<String, Object> result = Map.of(
            "today", today.toString(),
            "message", "Check logs for detailed information about today's birthday processing"
        );
        
        try {
            birthdayNotificationService.sendTodayBirthdayNotifications();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error in test today birthdays", e);
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/send-biografi/{biografiId}")
    public ResponseEntity<Map<String, String>> sendBirthdayNotificationForBiografi(@PathVariable Long biografiId) {
        try {
            birthdayNotificationService.sendBirthdayNotificationForBiografi(biografiId);
            return ResponseEntity.ok(Map.of("message", "Birthday notification sent successfully"));
        } catch (Exception e) {
            log.error("Error sending birthday notification for biografi {}", biografiId, e);
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to send birthday notification: " + e.getMessage()));
        }
    }
}
