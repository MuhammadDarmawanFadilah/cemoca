package com.shadcn.backend.controller;

import com.shadcn.backend.dto.BiografiEditDto;
import com.shadcn.backend.dto.BiografiFilterRequest;
import com.shadcn.backend.dto.BiografiRequest;
import com.shadcn.backend.dto.BiografiSearchDto;
import com.shadcn.backend.dto.BiografiProfileDto;
import com.shadcn.backend.dto.RecipientSummaryDTO;
import com.shadcn.backend.model.Biografi;
import com.shadcn.backend.service.AuthService;
import com.shadcn.backend.service.BiografiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST Controller for managing Biografi entities.
 * Uses Java 21 features and best practices for optimal performance.
 */
@Slf4j
@RestController
@RequestMapping("/api/biografi")
@RequiredArgsConstructor
public class BiografiController {

    private final BiografiService biografiService;
    private final AuthService authService;/**
     * Get all biografi with pagination using modern Java patterns
     */
    @GetMapping
    public ResponseEntity<Page<BiografiSearchDto>> getAllBiografi(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        
        log.debug("Fetching biografi page: {}, size: {}, sortBy: {}, direction: {}", 
                 page, size, sortBy, sortDirection);
        
        try {
            Page<BiografiSearchDto> biografiPage = biografiService.getAllBiografiDto(page, size, sortBy, sortDirection);
            return ResponseEntity.ok(biografiPage);
        } catch (Exception e) {
            log.error("Error fetching biografi list", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }// Get biografi with filters (for search functionality)
    @PostMapping("/search")
    public ResponseEntity<Page<BiografiSearchDto>> searchBiografi(@RequestBody BiografiFilterRequest filterRequest) {
        try {
            Page<BiografiSearchDto> biografiPage = biografiService.getBiografiSearchDto(filterRequest);
            return ResponseEntity.ok(biografiPage);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    // Get biografi by ID
    @GetMapping("/{id}")
    public ResponseEntity<BiografiSearchDto> getBiografiById(@PathVariable Long id) {
        try {
            Optional<BiografiSearchDto> biografi = biografiService.getBiografiDtoById(id);
            if (biografi.isPresent()) {
                return ResponseEntity.ok(biografi.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    // Get biografi by NIM
    @GetMapping("/nim/{nim}")
    public ResponseEntity<BiografiSearchDto> getBiografiByNim(@PathVariable String nim) {
        try {
            Optional<BiografiSearchDto> biografi = biografiService.getBiografiDtoByNim(nim);
            if (biografi.isPresent()) {
                return ResponseEntity.ok(biografi.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    // Get current user's biografi for editing
    @GetMapping("/my-biografi")
    public ResponseEntity<?> getMyBiografi(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Check if authorization header exists
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Anda harus login untuk mengakses biografi");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }
            
            // Extract token and get user ID
            String token = authHeader.substring(7);
            Long userId = authService.getUserIdFromToken(token);            
            if (userId == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Token tidak valid atau telah kedaluwarsa");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }
            
            // Check if user has a biography and get it efficiently (avoid N+1)
            Optional<BiografiProfileDto> biografiDto = biografiService.getMyBiografiProfile(userId);
            if (biografiDto.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Anda belum memiliki biografi");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            return ResponseEntity.ok(biografiDto.get());
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengambil data biografi");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Create new biografi
    @PostMapping
    public ResponseEntity<?> createBiografi(@Valid @RequestBody BiografiRequest biografiRequest) {
        try {
            Biografi newBiografi = biografiService.createBiografi(biografiRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(newBiografi);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat membuat biografi");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }    // Update biografi
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBiografi(
            @PathVariable Long id, 
            @Valid @RequestBody BiografiRequest biografiRequest,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Check if authorization header exists
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Anda harus login untuk mengedit biografi");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }
            
            // Extract token and get user ID
            String token = authHeader.substring(7);
            Long userId = authService.getUserIdFromToken(token);
            
            if (userId == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Token tidak valid atau telah kedaluwarsa");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }
            
            // Update the biography with authorization check built into service
            Biografi updatedBiografi = biografiService.updateBiografi(id, biografiRequest);
            return ResponseEntity.ok(updatedBiografi);
            
        } catch (SecurityException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengupdate biografi");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Soft delete biografi (change status to TIDAK_AKTIF)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBiografi(@PathVariable Long id) {
        try {
            biografiService.deleteBiografi(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Biografi berhasil dihapus");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat menghapus biografi");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Hard delete biografi (permanent delete)
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<?> hardDeleteBiografi(@PathVariable Long id) {
        try {
            biografiService.hardDeleteBiografi(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Biografi berhasil dihapus permanen");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat menghapus biografi");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }    // Search biografi by name
    @GetMapping("/search/name")
    public ResponseEntity<Page<BiografiSearchDto>> searchBiografiByName(
            @RequestParam String nama,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        try {
            Page<BiografiSearchDto> biografiPage = biografiService.searchBiografiDtoByName(nama, page, size);
            return ResponseEntity.ok(biografiPage);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }// Get biografi by exact name match (for comment author lookup)
    @GetMapping("/author/{nama}")
    public ResponseEntity<BiografiSearchDto> getBiografiByExactName(@PathVariable String nama) {
        try {
            Optional<BiografiSearchDto> biografi = biografiService.getBiografiDtoByExactName(nama);
            if (biografi.isPresent()) {
                return ResponseEntity.ok(biografi.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    // Get biografi by status
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<BiografiSearchDto>> getBiografiByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        try {
            Biografi.StatusBiografi statusEnum = Biografi.StatusBiografi.valueOf(status.toUpperCase());
            Page<BiografiSearchDto> biografiPage = biografiService.getBiografiDtoByStatus(statusEnum, page, size);
            return ResponseEntity.ok(biografiPage);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get recent biografi
    @GetMapping("/recent")
    public ResponseEntity<List<Biografi>> getRecentBiografi(@RequestParam(defaultValue = "5") int limit) {
        try {
            List<Biografi> recentBiografi = biografiService.getRecentBiografi(limit);
            return ResponseEntity.ok(recentBiografi);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get biografi statistics
    @GetMapping("/stats")
    public ResponseEntity<BiografiService.BiografiStats> getBiografiStats() {
        try {
            BiografiService.BiografiStats stats = biografiService.getBiografiStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Health check endpoint
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("service", "Biografi Service");
        return ResponseEntity.ok(response);    }

    // Optimized endpoint for recipient selection - returns only essential data
    @PostMapping("/recipients")
    public ResponseEntity<Page<RecipientSummaryDTO>> getRecipientsForSelection(@RequestBody BiografiFilterRequest filterRequest) {
        try {
            Page<RecipientSummaryDTO> recipientsPage = biografiService.getRecipientsForSelection(filterRequest);
            return ResponseEntity.ok(recipientsPage);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get recipient statistics for performance insights
    @PostMapping("/recipients/stats")
    public ResponseEntity<Map<String, Object>> getRecipientStats(@RequestBody BiografiFilterRequest filterRequest) {
        try {
            // Get total count without pagination
            BiografiFilterRequest countRequest = new BiografiFilterRequest();
            countRequest.setNama(filterRequest.getNama());
            countRequest.setJurusan(filterRequest.getJurusan());            countRequest.setKota(filterRequest.getKota());
            countRequest.setSpesialisasi(filterRequest.getSpesialisasi());
            countRequest.setAlumniTahun(filterRequest.getAlumniTahun());
            countRequest.setPage(0);
            countRequest.setSize(1);
            countRequest.setSortBy("namaLengkap");
            countRequest.setSortDirection("asc");
            
            Page<RecipientSummaryDTO> result = biografiService.getRecipientsForSelection(countRequest);
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalRecipients", result.getTotalElements());
            stats.put("hasPhoneNumber", result.getTotalElements()); // All recipients should have phone numbers
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Dropdown data endpoints
    @GetMapping("/filters/jurusan")
    public ResponseEntity<List<String>> getDistinctJurusan() {
        try {
            List<String> jurusan = biografiService.getDistinctJurusan();
            return ResponseEntity.ok(jurusan);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Get distinct location values for dropdown filters
    @GetMapping("/filters/provinsi")
    public ResponseEntity<List<String>> getDistinctProvinsi() {
        try {
            List<String> provinsiList = biografiService.getDistinctProvinsi();
            return ResponseEntity.ok(provinsiList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/filters/kota")
    public ResponseEntity<List<String>> getDistinctKota() {
        try {
            List<String> kotaList = biografiService.getDistinctKota();
            return ResponseEntity.ok(kotaList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/filters/kecamatan")
    public ResponseEntity<List<String>> getDistinctKecamatan() {
        try {
            List<String> kecamatanList = biografiService.getDistinctKecamatan();
            return ResponseEntity.ok(kecamatanList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/filters/kelurahan")
    public ResponseEntity<List<String>> getDistinctKelurahan() {
        try {
            List<String> kelurahanList = biografiService.getDistinctKelurahan();
            return ResponseEntity.ok(kelurahanList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get location mappings (code to name) for frontend filter handling
    @GetMapping("/filters/location-mappings/provinsi")
    public ResponseEntity<Map<String, String>> getProvinsiMappings() {
        try {
            Map<String, String> mappings = biografiService.getProvinsiMappings();
            return ResponseEntity.ok(mappings);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/filters/location-mappings/kota")
    public ResponseEntity<Map<String, String>> getKotaMappings() {
        try {
            Map<String, String> mappings = biografiService.getKotaMappings();
            return ResponseEntity.ok(mappings);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/filters/location-mappings/kecamatan")
    public ResponseEntity<Map<String, String>> getKecamatanMappings() {
        try {
            Map<String, String> mappings = biografiService.getKecamatanMappings();
            return ResponseEntity.ok(mappings);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/filters/location-mappings/kelurahan")
    public ResponseEntity<Map<String, String>> getKelurahanMappings() {
        try {
            Map<String, String> mappings = biografiService.getKelurahanMappings();
            return ResponseEntity.ok(mappings);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    // Get public biografi by ID (with masked sensitive data)
    @GetMapping("/public/{id}")
    public ResponseEntity<BiografiSearchDto> getPublicBiografiById(@PathVariable Long id) {
        try {
            Optional<BiografiSearchDto> biografiOpt = biografiService.getBiografiDtoById(id);
            if (biografiOpt.isPresent()) {
                BiografiSearchDto biografi = biografiOpt.get();
                
                // Check if biografi status is AKTIF (only show active profiles publicly)
                if (biografi.getStatus() != Biografi.StatusBiografi.AKTIF) {
                    return ResponseEntity.notFound().build();
                }
                
                // Mask sensitive phone number
                if (biografi.getNomorTelepon() != null && !biografi.getNomorTelepon().isEmpty()) {
                    biografi.setNomorTelepon(maskPhoneNumber(biografi.getNomorTelepon()));
                }
                
                // Don't include full address for privacy - only keep kota and provinsi
                biografi.setAlamat(null);
                
                return ResponseEntity.ok(biografi);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Helper method to mask phone numbers
    private String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() <= 4) {
            return phoneNumber;
        }
        
        String visibleStart = phoneNumber.substring(0, 4);
        String visibleEnd = phoneNumber.length() > 6 ? phoneNumber.substring(phoneNumber.length() - 2) : "";
        int maskedLength = Math.max(0, phoneNumber.length() - 6);
        String maskedMiddle = "*".repeat(maskedLength);
        
        return visibleStart + maskedMiddle + visibleEnd;
    }

    // Filter endpoints
    @GetMapping("/filters/alumni-tahun")
    public ResponseEntity<List<String>> getAlumniTahunFilters() {
        try {
            List<String> alumniTahunList = biografiService.getDistinctAlumniTahun();
            return ResponseEntity.ok(alumniTahunList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
      @GetMapping("/filters/pekerjaan")
    public ResponseEntity<List<String>> getPekerjaanFilters() {
        try {
            List<String> pekerjaanList = biografiService.getDistinctPekerjaan();
            return ResponseEntity.ok(pekerjaanList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/filters/spesialisasi")
    public ResponseEntity<List<String>> getSpesialisasiFilters() {
        try {
            List<String> spesialisasiList = biografiService.getDistinctSpesialisasi();
            return ResponseEntity.ok(spesialisasiList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    // Get alumni with coordinates for map display
    @GetMapping("/map-locations")
    public ResponseEntity<List<Map<String, Object>>> getAlumniMapLocations(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String provinsi,
            @RequestParam(required = false) String kota,
            @RequestParam(required = false) String kecamatan,
            @RequestParam(required = false) String kelurahan,
            @RequestParam(required = false) String kodePos,
            @RequestParam(required = false) String spesialisasi,
            @RequestParam(required = false) String pekerjaan,
            @RequestParam(required = false) String alumniTahun) {
        
        try {
            List<Map<String, Object>> locations = biografiService.getAlumniWithCoordinatesAdvanced(
                search, provinsi, kota, kecamatan, kelurahan, kodePos, spesialisasi, pekerjaan, alumniTahun);
            return ResponseEntity.ok(locations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Get biografi summary for map popup
    @GetMapping("/{id}/summary")
    public ResponseEntity<Map<String, Object>> getBiografiSummary(@PathVariable Long id) {
        try {
            Optional<Biografi> biografi = biografiService.getBiografiById(id);
            if (biografi.isPresent()) {
                Biografi b = biografi.get();
                Map<String, Object> summary = new HashMap<>();
                summary.put("biografiId", b.getBiografiId());
                summary.put("namaLengkap", b.getNamaLengkap());
                summary.put("alumniTahun", b.getAlumniTahun());
                summary.put("jurusan", b.getJurusan());
                summary.put("email", b.getEmail());
                summary.put("nomorTelepon", b.getNomorTelepon());
                summary.put("fotoProfil", b.getFotoProfil());
                summary.put("foto", b.getFoto());
                summary.put("kota", b.getKota());
                summary.put("provinsi", b.getProvinsi());
                summary.put("alamat", b.getAlamat());
                summary.put("pekerjaanSaatIni", b.getPekerjaanSaatIni());
                summary.put("latitude", b.getLatitude());
                summary.put("longitude", b.getLongitude());
                return ResponseEntity.ok(summary);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }    // Get biografi for editing with complete location details
    @GetMapping("/{id}/edit")
    public ResponseEntity<BiografiEditDto> getBiografiForEdit(@PathVariable Long id) {
        try {
            Optional<BiografiEditDto> biografi = biografiService.getBiografiForEdit(id);
            if (biografi.isPresent()) {
                return ResponseEntity.ok(biografi.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Error in getBiografiForEdit: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
