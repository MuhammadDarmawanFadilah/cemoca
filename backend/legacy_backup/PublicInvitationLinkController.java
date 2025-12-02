package com.shadcn.backend.controller;

import com.shadcn.backend.model.PublicInvitationLink;
import com.shadcn.backend.service.PublicInvitationLinkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/public-invitation-links")
@CrossOrigin(origins = "${frontend.url}")
public class PublicInvitationLinkController {
    
    @Value("${app.frontend.url}")
    private String frontendUrl;
    
    @Autowired
    private PublicInvitationLinkService publicInvitationLinkService;
    
    /**
     * Generate new public invitation link
     */
    @PostMapping("/generate")
    public ResponseEntity<?> generatePublicLink(
            @RequestParam(required = false) String description,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime expiresAt,
            @RequestParam(required = false) Integer maxUses) {
        try {
            PublicInvitationLink link = publicInvitationLinkService.generatePublicLink(description, expiresAt, maxUses);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Link undangan publik berhasil dibuat");
            response.put("link", link);
            response.put("registrationUrl", frontendUrl + "/register/public?token=" + link.getLinkToken());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat membuat link undangan publik");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Get public invitation link by token
     */
    @GetMapping("/token/{token}")
    public ResponseEntity<?> getPublicLinkByToken(@PathVariable String token) {
        try {
            Optional<PublicInvitationLink> linkOpt = publicInvitationLinkService.getByToken(token);
            if (!linkOpt.isPresent()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Link undangan tidak ditemukan");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            return ResponseEntity.ok(linkOpt.get());
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengambil link undangan");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Validate public invitation link
     */
    @GetMapping("/validate/{token}")
    public ResponseEntity<?> validatePublicLink(@PathVariable String token) {
        try {
            boolean isValid = publicInvitationLinkService.isLinkValid(token);
            Map<String, Object> response = new HashMap<>();
            response.put("valid", isValid);
            
            if (!isValid) {
                response.put("message", "Link undangan tidak valid atau sudah expired");
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat memvalidasi link undangan");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Get all public invitation links
     */
    @GetMapping
    public ResponseEntity<?> getAllPublicLinks() {
        try {
            List<PublicInvitationLink> links = publicInvitationLinkService.getAllLinks();
            return ResponseEntity.ok(links);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengambil daftar link undangan");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Get active public invitation links
     */
    @GetMapping("/active")
    public ResponseEntity<?> getActivePublicLinks() {
        try {
            List<PublicInvitationLink> links = publicInvitationLinkService.getActiveLinks();
            return ResponseEntity.ok(links);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengambil link undangan aktif");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Deactivate public invitation link
     */
    @PostMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivatePublicLink(@PathVariable Long id) {
        try {
            PublicInvitationLink link = publicInvitationLinkService.deactivateLink(id);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Link undangan berhasil dinonaktifkan");
            response.put("link", link);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat menonaktifkan link undangan");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Activate public invitation link
     */
    @PostMapping("/{id}/activate")
    public ResponseEntity<?> activatePublicLink(@PathVariable Long id) {
        try {
            PublicInvitationLink link = publicInvitationLinkService.activateLink(id);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Link undangan berhasil diaktifkan");
            response.put("link", link);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengaktifkan link undangan");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Get public invitation link statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getPublicLinkStatistics() {
        try {
            Object statistics = publicInvitationLinkService.getLinkStatistics();
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengambil statistik link undangan");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
