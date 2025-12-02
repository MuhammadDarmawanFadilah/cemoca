package com.shadcn.backend.controller;

import com.shadcn.backend.dto.InvitationRequest;
import com.shadcn.backend.dto.InvitationResponse;
import com.shadcn.backend.dto.PagedInvitationResponse;
import com.shadcn.backend.dto.RegistrationFromInvitationRequest;
import com.shadcn.backend.model.User;
import com.shadcn.backend.service.InvitationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/invitations")
@CrossOrigin(origins = "${frontend.url}")
@RequiredArgsConstructor
public class InvitationController {
    
    private final InvitationService invitationService;    /**
     * Send invitation to alumni
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendInvitation(@Valid @RequestBody InvitationRequest request) {
        try {
            log.debug("Sending invitation to: {}", request.getNamaLengkap());
            InvitationResponse response = invitationService.sendInvitation(request);
            log.info("Invitation sent successfully to: {}", request.getNamaLengkap());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            log.warn("Failed to send invitation to {}: {}", request.getNamaLengkap(), e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("Error sending invitation to: {}", request.getNamaLengkap(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengirim undangan");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Get invitation by token
     */
    @GetMapping("/token/{token}")
    public ResponseEntity<?> getInvitationByToken(@PathVariable String token) {
        try {
            InvitationResponse response = invitationService.getInvitationByToken(token);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengambil data undangan");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Register user from invitation
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerFromInvitation(@Valid @RequestBody RegistrationFromInvitationRequest request) {
        try {
            User user = invitationService.registerFromInvitation(request);
            
            // Remove password from response
            user.setPassword(null);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(user);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mendaftar");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Get all invitations
     */
    @GetMapping
    public ResponseEntity<?> getAllInvitations() {
        try {
            List<InvitationResponse> invitations = invitationService.getAllInvitations();
            return ResponseEntity.ok(invitations);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengambil data undangan");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Get invitation by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getInvitationById(@PathVariable Long id) {
        try {
            InvitationResponse response = invitationService.getInvitationById(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengambil data undangan");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Get invitation statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getInvitationStatistics() {
        try {
            Object statistics = invitationService.getInvitationStatistics();
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengambil statistik undangan");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
      /**
     * Get all invitations history with pagination and filtering
     */
    @GetMapping("/history/paginated")
    public ResponseEntity<?> getInvitationHistoryPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String nama,
            @RequestParam(required = false) String phone,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        try {
            PagedInvitationResponse history = invitationService.getInvitationHistory(page, size, status, nama, phone, sortBy, sortDirection);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengambil histori undangan: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Get all invitations history
     */
    @GetMapping("/history")
    public ResponseEntity<?> getInvitationHistory() {
        try {
            List<InvitationResponse> history = invitationService.getAllInvitations();
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengambil histori undangan");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Resend invitation
     */
    @PostMapping("/{id}/resend")
    public ResponseEntity<?> resendInvitation(@PathVariable Long id) {
        try {
            InvitationResponse response = invitationService.resendInvitation(id);
            Map<String, Object> result = new HashMap<>();
            result.put("message", "Undangan berhasil dikirim ulang");
            result.put("invitation", response);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengirim ulang undangan");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Cancel invitation
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelInvitation(@PathVariable Long id) {
        try {
            InvitationResponse response = invitationService.cancelInvitation(id);
            Map<String, Object> result = new HashMap<>();
            result.put("message", "Undangan berhasil dibatalkan");
            result.put("invitation", response);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat membatalkan undangan");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Cleanup expired invitations
     */
    @PostMapping("/cleanup")
    public ResponseEntity<?> cleanupExpiredInvitations() {
        try {
            int cleanedCount = invitationService.cleanupExpiredInvitations();
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Berhasil membersihkan undangan kadaluarsa");
            response.put("cleanedCount", cleanedCount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat membersihkan undangan kadaluarsa");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
