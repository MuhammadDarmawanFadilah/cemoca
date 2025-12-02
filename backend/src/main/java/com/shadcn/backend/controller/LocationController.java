package com.shadcn.backend.controller;

import com.shadcn.backend.dto.KotaResponseDTO;
import com.shadcn.backend.dto.ProvinsiResponseDTO;
import com.shadcn.backend.dto.ProvinsiRequest;
import com.shadcn.backend.dto.KotaRequest;
import com.shadcn.backend.service.LocationService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/location")
@Slf4j
public class LocationController {

    @Autowired
    private LocationService locationService;

    // ============ READ ENDPOINTS (PUBLIC) ============

    // Get all provinces (without kota list for performance)
    @GetMapping("/provinsi")
    public ResponseEntity<List<ProvinsiResponseDTO>> getAllProvinsi() {
        try {
            List<ProvinsiResponseDTO> provinsiList = locationService.getAllProvinsiOnly();
            return ResponseEntity.ok(provinsiList);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get all provinces with their kota list
    @GetMapping("/provinsi/with-kota")
    public ResponseEntity<List<ProvinsiResponseDTO>> getAllProvinsiWithKota() {
        try {
            List<ProvinsiResponseDTO> provinsiList = locationService.getAllProvinsi();
            return ResponseEntity.ok(provinsiList);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get provinsi by ID
    @GetMapping("/provinsi/{id}")
    public ResponseEntity<ProvinsiResponseDTO> getProvinsiById(@PathVariable Long id) {
        try {
            ProvinsiResponseDTO provinsi = locationService.getProvinsiById(id);
            return ResponseEntity.ok(provinsi);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get kota by provinsi ID
    @GetMapping("/provinsi/{provinsiId}/kota")
    public ResponseEntity<List<KotaResponseDTO>> getKotaByProvinsiId(@PathVariable Long provinsiId) {
        try {
            List<KotaResponseDTO> kotaList = locationService.getKotaByProvinsiId(provinsiId);
            return ResponseEntity.ok(kotaList);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get kota by provinsi name
    @GetMapping("/kota/by-provinsi")
    public ResponseEntity<List<KotaResponseDTO>> getKotaByProvinsiNama(@RequestParam String provinsiNama) {
        try {
            List<KotaResponseDTO> kotaList = locationService.getKotaByProvinsiNama(provinsiNama);
            return ResponseEntity.ok(kotaList);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get provinsi by name
    @GetMapping("/provinsi/by-name")
    public ResponseEntity<ProvinsiResponseDTO> getProvinsiByNama(@RequestParam String nama) {
        try {
            Optional<ProvinsiResponseDTO> provinsi = locationService.getProvinsiByNama(nama);
            return provinsi.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ============ CRUD ENDPOINTS FOR ADMIN ============
    
    // Get provinsi with pagination (ADMIN)
    @GetMapping("/admin/provinsi")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Page<ProvinsiResponseDTO>> getAllProvinsiWithPagination(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        log.info("GET /api/location/admin/provinsi - search: {}, page: {}, size: {}", search, page, size);
        
        try {
            Page<ProvinsiResponseDTO> result = locationService.getAllProvinsiWithPagination(search, page, size);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting provinsi with pagination", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // Create provinsi (ADMIN)
    @PostMapping("/admin/provinsi")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<ProvinsiResponseDTO> createProvinsi(@Valid @RequestBody ProvinsiRequest request) {
        log.info("POST /api/location/admin/provinsi - {}", request);
        
        try {
            ProvinsiResponseDTO result = locationService.createProvinsi(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (RuntimeException e) {
            log.error("Error creating provinsi: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error creating provinsi", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // Update provinsi (ADMIN)
    @PutMapping("/admin/provinsi/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<ProvinsiResponseDTO> updateProvinsi(@PathVariable Long id, @Valid @RequestBody ProvinsiRequest request) {
        log.info("PUT /api/location/admin/provinsi/{} - {}", id, request);
        
        try {
            ProvinsiResponseDTO result = locationService.updateProvinsi(id, request);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            log.error("Error updating provinsi: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error updating provinsi", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // Delete provinsi (ADMIN)
    @DeleteMapping("/admin/provinsi/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProvinsi(@PathVariable Long id) {
        log.info("DELETE /api/location/admin/provinsi/{}", id);
        
        try {
            locationService.deleteProvinsi(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting provinsi: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error deleting provinsi", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // Get kota with pagination (ADMIN)
    @GetMapping("/admin/kota")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Page<KotaResponseDTO>> getAllKotaWithPagination(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long provinsiId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        log.info("GET /api/location/admin/kota - search: {}, provinsiId: {}, page: {}, size: {}", 
                search, provinsiId, page, size);
        
        try {
            Page<KotaResponseDTO> result = locationService.getAllKotaWithPagination(search, provinsiId, page, size);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting kota with pagination", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // Get kota by ID (ADMIN)
    @GetMapping("/admin/kota/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<KotaResponseDTO> getKotaByIdAdmin(@PathVariable Long id) {
        log.info("GET /api/location/admin/kota/{}", id);
        
        try {
            KotaResponseDTO result = locationService.getKotaById(id);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            log.error("Error getting kota: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error getting kota", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // Create kota (ADMIN)
    @PostMapping("/admin/kota")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<KotaResponseDTO> createKota(@Valid @RequestBody KotaRequest request) {
        log.info("POST /api/location/admin/kota - {}", request);
        
        try {
            KotaResponseDTO result = locationService.createKota(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (RuntimeException e) {
            log.error("Error creating kota: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error creating kota", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // Update kota (ADMIN)
    @PutMapping("/admin/kota/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<KotaResponseDTO> updateKota(@PathVariable Long id, @Valid @RequestBody KotaRequest request) {
        log.info("PUT /api/location/admin/kota/{} - {}", id, request);
        
        try {
            KotaResponseDTO result = locationService.updateKota(id, request);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            log.error("Error updating kota: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error updating kota", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // Delete kota (ADMIN)
    @DeleteMapping("/admin/kota/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteKota(@PathVariable Long id) {
        log.info("DELETE /api/location/admin/kota/{}", id);
        
        try {
            locationService.deleteKota(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting kota: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error deleting kota", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // ============ UTILITY ENDPOINTS ============

    // Temporary endpoint to reset location data (FOR DEVELOPMENT ONLY)
    @PostMapping("/reset-data")
    public ResponseEntity<String> resetLocationData() {
        try {
            locationService.resetAndInitializeData();
            return ResponseEntity.ok("Location data has been reset and re-initialized successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error resetting data: " + e.getMessage());
        }
    }
}
