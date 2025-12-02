package com.shadcn.backend.controller;

import com.shadcn.backend.entity.MidtransConfig;
import com.shadcn.backend.service.MidtransConfigService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/midtrans-config")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class MidtransConfigController {
    
    private static final Logger logger = LoggerFactory.getLogger(MidtransConfigController.class);
    
    @Autowired
    private MidtransConfigService midtransConfigService;
    
    /**
     * Get active Midtrans configuration
     */
    @GetMapping("/active")
    public ResponseEntity<MidtransConfig> getActiveConfig() {
        try {
            MidtransConfig config = midtransConfigService.getActiveConfig();
            // Hide sensitive information
            config.setServerKey("***HIDDEN***");
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            logger.error("Error getting active Midtrans config", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get all Midtrans configurations
     */
    @GetMapping
    public ResponseEntity<List<MidtransConfig>> getAllConfigs() {
        try {
            List<MidtransConfig> configs = midtransConfigService.getAllConfigs();
            // Hide sensitive information
            configs.forEach(config -> config.setServerKey("***HIDDEN***"));
            return ResponseEntity.ok(configs);
        } catch (Exception e) {
            logger.error("Error getting all Midtrans configs", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Save new Midtrans configuration
     */
    @PostMapping
    public ResponseEntity<?> saveConfig(@Valid @RequestBody MidtransConfig config) {
        try {
            MidtransConfig savedConfig = midtransConfigService.saveConfig(config);
            // Hide sensitive information in response
            savedConfig.setServerKey("***HIDDEN***");
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Konfigurasi Midtrans berhasil disimpan",
                "data", savedConfig
            ));
        } catch (Exception e) {
            logger.error("Error saving Midtrans config", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Gagal menyimpan konfigurasi: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Update existing Midtrans configuration
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateConfig(@PathVariable Long id, @Valid @RequestBody MidtransConfig config) {
        try {
            config.setId(id);
            MidtransConfig updatedConfig = midtransConfigService.saveConfig(config);
            // Hide sensitive information in response
            updatedConfig.setServerKey("***HIDDEN***");
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Konfigurasi Midtrans berhasil diperbarui",
                "data", updatedConfig
            ));
        } catch (Exception e) {
            logger.error("Error updating Midtrans config", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Gagal memperbarui konfigurasi: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Delete Midtrans configuration
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteConfig(@PathVariable Long id) {
        try {
            midtransConfigService.deleteConfig(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Konfigurasi Midtrans berhasil dihapus"
            ));
        } catch (Exception e) {
            logger.error("Error deleting Midtrans config", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Gagal menghapus konfigurasi: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Activate specific Midtrans configuration
     */
    @PostMapping("/{id}/activate")
    public ResponseEntity<?> activateConfig(@PathVariable Long id) {
        try {
            midtransConfigService.activateConfig(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Konfigurasi Midtrans berhasil diaktifkan"
            ));
        } catch (Exception e) {
            logger.error("Error activating Midtrans config", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Gagal mengaktifkan konfigurasi: " + e.getMessage()
            ));
        }
    }
}