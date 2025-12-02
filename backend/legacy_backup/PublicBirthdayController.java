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

@RestController
@RequestMapping("/api/birthday-notifications")
@RequiredArgsConstructor
@Slf4j
public class PublicBirthdayController {
    
    private final BirthdayNotificationService birthdayNotificationService;

    @GetMapping
    public ResponseEntity<Page<BirthdayNotificationDTO>> getBirthdayNotifications(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String alumniYear,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean isExcluded,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String startBirthDate,
            @RequestParam(required = false) String endBirthDate,
            @RequestParam(required = false) Integer maxDaysUntilBirthday,
            @RequestParam(required = false) String nama,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "notificationDate") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {
        
        log.info("Received request with maxDaysUntilBirthday: {}", maxDaysUntilBirthday);
        
        BirthdayNotificationFilter filter = new BirthdayNotificationFilter();
        filter.setYear(year != null ? year : LocalDate.now().getYear());
        filter.setAlumniYear(alumniYear);
        filter.setStatus(status);
        filter.setIsExcluded(isExcluded != null ? isExcluded.toString() : null);
        filter.setStartDate(startDate);
        filter.setEndDate(endDate);
        filter.setStartBirthDate(startBirthDate);
        filter.setEndBirthDate(endBirthDate);
        filter.setMaxDaysUntilBirthday(maxDaysUntilBirthday != null ? maxDaysUntilBirthday.toString() : null);
        filter.setNama(nama);
        filter.setPage(page);
        filter.setSize(size);
        filter.setSortBy(sortBy);
        filter.setSortDirection(sortDirection);
        
        Page<BirthdayNotificationDTO> notifications = birthdayNotificationService
            .getBirthdayNotifications(filter);
        
        log.info("Returning {} notifications out of {} total", 
                notifications.getNumberOfElements(), notifications.getTotalElements());
        
        return ResponseEntity.ok(notifications);
    }
}
