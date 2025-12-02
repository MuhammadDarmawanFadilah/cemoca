package com.shadcn.backend.controller;

import com.shadcn.backend.dto.UserApprovalDto;
import com.shadcn.backend.service.UserApprovalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user-approvals")
@CrossOrigin(origins = "${frontend.url}")
public class UserApprovalController {
    
    @Autowired
    private UserApprovalService userApprovalService;
      /**
     * Get all users waiting for approval
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getUsersWaitingApproval() {
        try {
            List<UserApprovalDto> users = userApprovalService.getUsersWaitingApproval();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengambil daftar pengguna menunggu persetujuan");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get users waiting for approval with pagination
     */
    @GetMapping("/pending/paginated")
    public ResponseEntity<?> getUsersWaitingApprovalPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        try {
            Page<UserApprovalDto> users = userApprovalService.getUsersWaitingApprovalPaginated(
                page, size, search, sortBy, sortDirection);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengambil daftar pengguna menunggu persetujuan");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Approve user registration
     */
    @PostMapping("/{userId}/approve")
    public ResponseEntity<?> approveUser(@PathVariable Long userId) {
        try {
            UserApprovalDto user = userApprovalService.approveUser(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Pengguna berhasil disetujui");
            response.put("user", user);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(400).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat menyetujui pengguna");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Reject user registration
     */
    @PostMapping("/{userId}/reject")
    public ResponseEntity<?> rejectUser(@PathVariable Long userId, 
                                       @RequestParam(required = false) String reason) {
        try {
            UserApprovalDto user = userApprovalService.rejectUser(userId, reason);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Pengguna berhasil ditolak");
            response.put("user", user);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(400).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat menolak pengguna");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get approval statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getApprovalStatistics() {
        try {
            Object statistics = userApprovalService.getApprovalStatistics();
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengambil statistik persetujuan");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get count of users waiting approval
     */
    @GetMapping("/pending/count")
    public ResponseEntity<?> getUsersWaitingApprovalCount() {
        try {
            long count = userApprovalService.getUsersWaitingApprovalCount();
            Map<String, Object> response = new HashMap<>();
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengambil jumlah pengguna menunggu persetujuan");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get approved users with pagination
     */
    @GetMapping("/approved/paginated")
    public ResponseEntity<?> getApprovedUsersPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        try {
            Page<UserApprovalDto> users = userApprovalService.getApprovedUsersPaginated(
                page, size, search, sortBy, sortDirection);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengambil daftar pengguna yang disetujui");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get rejected users with pagination
     */
    @GetMapping("/rejected/paginated")
    public ResponseEntity<?> getRejectedUsersPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        try {
            Page<UserApprovalDto> users = userApprovalService.getRejectedUsersPaginated(
                page, size, search, sortBy, sortDirection);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengambil daftar pengguna yang ditolak");
            return ResponseEntity.status(500).body(error);
        }
    }
    
    /**
     * Get all users with pagination
     */
    @GetMapping("/all/paginated")
    public ResponseEntity<?> getAllUsersPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        try {
            Page<UserApprovalDto> users = userApprovalService.getAllUsersPaginated(
                page, size, search, sortBy, sortDirection);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengambil daftar semua pengguna");
            return ResponseEntity.status(500).body(error);
        }
    }
}
