package com.shadcn.backend.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.shadcn.backend.dto.DailyStatusResponse;
import com.shadcn.backend.dto.IntakeHistoryRequest;
import com.shadcn.backend.model.IntakeHistory;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.UserRepository;
import com.shadcn.backend.service.AuthService;
import com.shadcn.backend.service.IntakeHistoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/intake-history")
@RequiredArgsConstructor
public class IntakeHistoryController {
    
    private final IntakeHistoryService intakeHistoryService;
    private final UserRepository userRepository;
    private final AuthService authService;
    
    @PostMapping
    public ResponseEntity<IntakeHistory> createIntakeHistory(@Valid @RequestBody IntakeHistoryRequest request) {
        IntakeHistory intakeHistory = intakeHistoryService.createIntakeHistory(request);
        return ResponseEntity.ok(intakeHistory);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<IntakeHistory> getIntakeHistory(@PathVariable Long id) {
        IntakeHistory intakeHistory = intakeHistoryService.getIntakeHistory(id);
        return ResponseEntity.ok(intakeHistory);
    }
    
    @GetMapping
    public ResponseEntity<Page<IntakeHistory>> getAllIntakeHistory(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Page<IntakeHistory> intakeHistory = intakeHistoryService.getAllIntakeHistory(page, size);
        return ResponseEntity.ok(intakeHistory);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<IntakeHistory>> getIntakeHistoryByUser(@PathVariable Long userId) {
        List<IntakeHistory> intakeHistory = intakeHistoryService.getIntakeHistoryByUser(userId);
        return ResponseEntity.ok(intakeHistory);
    }
    
    @PutMapping("/replace-today")
    public ResponseEntity<?> replaceTodayIntake(
            @Valid @RequestBody IntakeHistoryRequest request,
            @RequestHeader(value = "Authorization", required = false) String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        User user = authService.getUserFromToken(token.substring(7));
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        }
        request.setUserId(user.getId());
        IntakeHistory intakeHistory = intakeHistoryService.replaceTodayIntake(request);
        return ResponseEntity.ok(intakeHistory);
    }
    
    @GetMapping("/check-today")
    public ResponseEntity<Map<String, Object>> checkTodayIntake(
            @RequestHeader(value = "Authorization", required = false) String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        
        User user = authService.getUserFromToken(token.substring(7));
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        }
        
        boolean hasIntake = intakeHistoryService.hasIntakeToday(user.getId());
        IntakeHistory todayIntake = intakeHistoryService.getTodayIntake(user.getId());
        boolean canTakeNow = intakeHistoryService.canTakeIntakeNow(user);
        
        Map<String, Object> response = new HashMap<>();
        response.put("hasIntakeToday", hasIntake);
        response.put("todayIntake", todayIntake);
        response.put("canTakeNow", canTakeNow);
        response.put("medicationTime", user.getMedicationTime());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/daily-status")
    public ResponseEntity<DailyStatusResponse> getDailyStatus(
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) 
            LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        DailyStatusResponse response = intakeHistoryService.getDailyStatus(date);
        return ResponseEntity.ok(response);
    }
}
