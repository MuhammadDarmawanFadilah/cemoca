package com.shadcn.backend.controller;

import com.shadcn.backend.dto.CreateKategoriRequest;
import com.shadcn.backend.model.Kategori;
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
@RequestMapping("/api/kategori")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class KategoriController {
    
    @Autowired
    private KategoriService kategoriService;
    
    @GetMapping
    public ResponseEntity<List<Kategori>> getAllKategori() {
        try {
            List<Kategori> kategoris = kategoriService.getAllKategori();
            return ResponseEntity.ok(kategoris);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/paginated")
    public ResponseEntity<Page<Kategori>> getAllKategoriPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Kategori> kategoris = kategoriService.getAllKategoriPaginated(pageable);
            return ResponseEntity.ok(kategoris);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Kategori> getKategoriById(@PathVariable Long id) {
        try {
            Optional<Kategori> kategori = kategoriService.getKategoriById(id);
            return kategori.map(ResponseEntity::ok)
                          .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PostMapping
    public ResponseEntity<Kategori> createKategori(@RequestBody CreateKategoriRequest request) {
        try {
            // Check if kategori with same name already exists
            if (kategoriService.existsByNama(request.getNama())) {
                return ResponseEntity.badRequest().build();
            }
            
            // Create kategori from request
            Kategori kategori = Kategori.builder()
                    .nama(request.getNama())
                    .deskripsi(request.getDeskripsi())
                    .build();
            
            Kategori createdKategori = kategoriService.createKategori(kategori);
            return ResponseEntity.ok(createdKategori);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Kategori> updateKategori(@PathVariable Long id, @RequestBody CreateKategoriRequest request) {
        try {
            // Check if kategori with same name already exists (excluding current)
            if (kategoriService.existsByNamaAndNotId(request.getNama(), id)) {
                return ResponseEntity.badRequest().build();
            }
            
            // Get existing kategori
            Optional<Kategori> existingKategoriOpt = kategoriService.getKategoriById(id);
            if (existingKategoriOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Kategori existingKategori = existingKategoriOpt.get();
            existingKategori.setNama(request.getNama());
            existingKategori.setDeskripsi(request.getDeskripsi());
            
            Kategori updatedKategori = kategoriService.updateKategori(id, existingKategori);
            return ResponseEntity.ok(updatedKategori);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteKategori(@PathVariable Long id) {
        try {
            kategoriService.deleteKategori(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Kategori>> searchKategoriByNama(@RequestParam String nama) {
        try {
            List<Kategori> kategoris = kategoriService.searchKategoriByNama(nama);
            return ResponseEntity.ok(kategoris);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/exists")
    public ResponseEntity<Boolean> checkKategoriExists(@RequestParam String nama) {
        try {
            boolean exists = kategoriService.existsByNama(nama);
            return ResponseEntity.ok(exists);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}