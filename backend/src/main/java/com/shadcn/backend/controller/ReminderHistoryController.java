package com.shadcn.backend.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.shadcn.backend.model.ReminderHistory;
import com.shadcn.backend.service.ReminderHistoryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/reminder-history")
@RequiredArgsConstructor
public class ReminderHistoryController {
    
    private final ReminderHistoryService reminderHistoryService;
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<ReminderHistory>> getAllReminderHistory(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Page<ReminderHistory> reminderHistory = reminderHistoryService.getAllReminderHistory(page, size);
        return ResponseEntity.ok(reminderHistory);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReminderHistory>> getReminderHistoryByUser(@PathVariable Long userId) {
        List<ReminderHistory> reminderHistory = reminderHistoryService.getReminderHistoryByUser(userId);
        return ResponseEntity.ok(reminderHistory);
    }
}
