package com.shadcn.backend.controller;

import com.shadcn.backend.dto.CreateBarangRequest;
import com.shadcn.backend.model.Barang;
import com.shadcn.backend.model.Kategori;
import com.shadcn.backend.service.BarangService;
import com.shadcn.backend.service.KategoriService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/barang")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class BarangController {
    
    @Autowired
    private BarangService barangService;
    
    @Autowired
    private KategoriService kategoriService;
    
    @GetMapping
    public ResponseEntity<List<Barang>> getAllBarang() {
        try {
            List<Barang> barangs = barangService.getAllBarang();
            return ResponseEntity.ok(barangs);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/paginated")
    public ResponseEntity<Page<Barang>> getAllBarangPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Barang> barangs = barangService.getAllBarangPaginated(pageable);
            return ResponseEntity.ok(barangs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<Page<Barang>> searchBarang(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String nama,
            @RequestParam(required = false) Long kategoriId,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) Double minHarga,
            @RequestParam(required = false) Double maxHarga) {
        try {
            Page<Barang> barangs = barangService.searchBarang(
                page, size, nama, kategoriId, sortBy, sortDir, minHarga, maxHarga);
            return ResponseEntity.ok(barangs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Barang> getBarangById(@PathVariable Long id) {
        try {
            Optional<Barang> barang = barangService.getBarangById(id);
            return barang.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PostMapping
    public ResponseEntity<Barang> createBarang(@RequestBody CreateBarangRequest request) {
        try {
            System.out.println("=== CREATE BARANG REQUEST ===");
            System.out.println("Request data: " + request);
            System.out.println("KategoriId: " + request.getKategoriId());
            System.out.println("Gambar: " + request.getGambar());
            
            // Validate required fields
            if (request.getNama() == null || request.getNama().trim().isEmpty()) {
                System.out.println("ERROR: Nama barang is required");
                return ResponseEntity.badRequest().build();
            }
            
            if (request.getKategoriId() == null) {
                System.out.println("ERROR: KategoriId is required");
                return ResponseEntity.badRequest().build();
            }
            
            // Get kategori
            Optional<Kategori> kategoriOpt = kategoriService.getKategoriById(request.getKategoriId());
            if (kategoriOpt.isEmpty()) {
                System.out.println("ERROR: Kategori not found with id: " + request.getKategoriId());
                return ResponseEntity.badRequest().build();
            }
            
            Kategori kategori = kategoriOpt.get();
            System.out.println("SUCCESS: Found kategori: " + kategori.getNama());
            
            // Create barang with proper validation
            Barang barang = Barang.builder()
                    .nama(request.getNama().trim())
                    .berat(request.getBerat() != null ? request.getBerat() : java.math.BigDecimal.ZERO)
                    .kategori(kategori)
                    .stock(request.getStock() != null ? request.getStock() : 0)
                    .harga(request.getHarga() != null ? request.getHarga() : java.math.BigDecimal.ZERO)
                    .poin(request.getPoin() != null ? request.getPoin() : 0)
                    .gambar(request.getGambar() != null ? request.getGambar().trim() : null)
                    .isActive(true)
                    .build();
            
            System.out.println("SUCCESS: Created barang object with image: " + barang.getGambar());
            
            Barang savedBarang = barangService.createBarang(barang);
            System.out.println("SUCCESS: Saved barang with ID: " + savedBarang.getId());
            
            return ResponseEntity.ok(savedBarang);
        } catch (RuntimeException e) {
            System.out.println("ERROR: Runtime exception: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.out.println("ERROR: General exception: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Barang> updateBarang(@PathVariable Long id, @RequestBody CreateBarangRequest request) {
        try {
            System.out.println("=== UPDATE BARANG REQUEST ===");
            System.out.println("BarangId: " + id);
            System.out.println("Request data: " + request);
            System.out.println("Gambar: " + request.getGambar());
            
            // Get existing barang
            Optional<Barang> existingBarangOpt = barangService.getBarangById(id);
            if (existingBarangOpt.isEmpty()) {
                System.out.println("ERROR: Barang not found with id: " + id);
                return ResponseEntity.notFound().build();
            }
            
            // Get kategori
            Optional<Kategori> kategoriOpt = kategoriService.getKategoriById(request.getKategoriId());
            if (kategoriOpt.isEmpty()) {
                System.out.println("ERROR: Kategori not found with id: " + request.getKategoriId());
                return ResponseEntity.badRequest().build();
            }
            
            Barang existingBarang = existingBarangOpt.get();
            Kategori kategori = kategoriOpt.get();
            
            System.out.println("SUCCESS: Found existing barang: " + existingBarang.getNama());
            System.out.println("SUCCESS: Found kategori: " + kategori.getNama());
            
            // Update barang details with validation
            existingBarang.setNama(request.getNama() != null ? request.getNama().trim() : existingBarang.getNama());
            existingBarang.setBerat(request.getBerat() != null ? request.getBerat() : existingBarang.getBerat());
            existingBarang.setKategori(kategori);
            existingBarang.setStock(request.getStock() != null ? request.getStock() : existingBarang.getStock());
            existingBarang.setHarga(request.getHarga() != null ? request.getHarga() : existingBarang.getHarga());
            existingBarang.setPoin(request.getPoin() != null ? request.getPoin() : existingBarang.getPoin());
            
            // Update image only if provided
            if (request.getGambar() != null && !request.getGambar().trim().isEmpty()) {
                existingBarang.setGambar(request.getGambar().trim());
                System.out.println("SUCCESS: Updated image to: " + existingBarang.getGambar());
            }
            
            Barang updatedBarang = barangService.updateBarang(id, existingBarang);
            System.out.println("SUCCESS: Updated barang with ID: " + updatedBarang.getId());
            
            return ResponseEntity.ok(updatedBarang);
        } catch (RuntimeException e) {
            System.out.println("ERROR: Runtime exception: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.out.println("ERROR: General exception: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBarang(@PathVariable Long id) {
        try {
            barangService.deleteBarang(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/kategori/{kategoriId}")
    public ResponseEntity<List<Barang>> getBarangByKategoriId(@PathVariable Long kategoriId) {
        try {
            List<Barang> barangs = barangService.getBarangByKategoriId(kategoriId);
            return ResponseEntity.ok(barangs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/available")
    public ResponseEntity<List<Barang>> getBarangAvailable() {
        try {
            List<Barang> barangs = barangService.getBarangAvailable();
            return ResponseEntity.ok(barangs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/out-of-stock")
    public ResponseEntity<List<Barang>> getBarangOutOfStock() {
        try {
            List<Barang> barangs = barangService.getBarangOutOfStock();
            return ResponseEntity.ok(barangs);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping("/{id}/stock")
    public ResponseEntity<Barang> updateStock(@PathVariable Long id, @RequestParam Integer stock) {
        try {
            Barang updatedBarang = barangService.updateStock(id, stock);
            return ResponseEntity.ok(updatedBarang);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/count")
    public ResponseEntity<Long> countTotalBarang() {
        try {
            long count = barangService.countTotalBarang();
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/count/available")
    public ResponseEntity<Long> countBarangAvailable() {
        try {
            long count = barangService.countBarangAvailable();
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<Barang> toggleStatus(@PathVariable Long id) {
        try {
            Barang updatedBarang = barangService.toggleStatus(id);
            return ResponseEntity.ok(updatedBarang);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}