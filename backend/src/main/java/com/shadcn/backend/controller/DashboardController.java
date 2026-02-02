package com.shadcn.backend.controller;

import com.shadcn.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "${frontend.url}")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        try {
            log.info("Getting dashboard statistics");
            Map<String, Object> stats = dashboardService.getDashboardStats();
            log.info("Successfully retrieved dashboard statistics");
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting dashboard statistics", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("data", null);
            errorResponse.put("message", "Error retrieving dashboard statistics: " + e.getMessage());
            errorResponse.put("timestamp", java.time.LocalDateTime.now().toString());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/charts")
    public ResponseEntity<Map<String, Object>> getDashboardCharts() {
        try {
            log.info("Getting dashboard charts data");
            Map<String, Object> charts = dashboardService.getDashboardCharts();
            log.info("Successfully retrieved dashboard charts");
            return ResponseEntity.ok(charts);
        } catch (Exception e) {
            log.error("Error getting dashboard charts", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("data", null);
            errorResponse.put("message", "Error retrieving dashboard charts: " + e.getMessage());
            errorResponse.put("timestamp", java.time.LocalDateTime.now().toString());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getDashboardOverview() {
        try {
            log.info("Getting dashboard overview data");
            Map<String, Object> overview = dashboardService.getDashboardCharts();
            log.info("Successfully retrieved dashboard overview");
            return ResponseEntity.ok(overview);
        } catch (Exception e) {
            log.error("Error getting dashboard overview", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("data", null);
            errorResponse.put("message", "Error retrieving dashboard overview: " + e.getMessage());
            errorResponse.put("timestamp", java.time.LocalDateTime.now().toString());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        log.info("Dashboard health check requested");
        return ResponseEntity.ok("Dashboard API is running");
    }
}
