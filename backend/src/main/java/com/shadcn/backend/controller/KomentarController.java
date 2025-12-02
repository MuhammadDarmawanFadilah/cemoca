package com.shadcn.backend.controller;

import com.shadcn.backend.dto.KomentarRequest;
import com.shadcn.backend.dto.KomentarBeritaDto;
import com.shadcn.backend.model.KomentarBerita;
import com.shadcn.backend.service.KomentarService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/komentar")
@CrossOrigin(origins = "${frontend.url}")
public class KomentarController {

    @Autowired
    private KomentarService komentarService;

    @PostMapping
    public ResponseEntity<KomentarBerita> tambahKomentar(@Valid @RequestBody KomentarRequest request) {
        try {
            KomentarBerita komentar = komentarService.tambahKomentar(request);
            return ResponseEntity.ok(komentar);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/berita/{beritaId}")
    public ResponseEntity<List<KomentarBerita>> getKomentarByBerita(@PathVariable Long beritaId) {
        List<KomentarBerita> komentar = komentarService.getKomentarByBerita(beritaId);
        return ResponseEntity.ok(komentar);
    }

    @GetMapping("/berita/{beritaId}/paginated")
    public ResponseEntity<Page<KomentarBerita>> getKomentarByBeritaPaginated(
            @PathVariable Long beritaId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<KomentarBerita> komentarPage = komentarService.getKomentarByBeritaPaginated(beritaId, pageable);
        return ResponseEntity.ok(komentarPage);
    }
    
    @GetMapping("/berita/{beritaId}/paginated-dto")
    public ResponseEntity<Page<KomentarBeritaDto>> getKomentarByBeritaPaginatedDto(
            @PathVariable Long beritaId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<KomentarBeritaDto> komentarPage = komentarService.getKomentarByBeritaPaginatedDto(beritaId, page, size);
        return ResponseEntity.ok(komentarPage);
    }

    @GetMapping("/{komentarId}/balasan")
    public ResponseEntity<List<KomentarBerita>> getBalasanKomentar(@PathVariable Long komentarId) {
        List<KomentarBerita> balasan = komentarService.getBalasanKomentar(komentarId);
        return ResponseEntity.ok(balasan);
    }

    @PutMapping("/{komentarId}")
    public ResponseEntity<KomentarBerita> updateKomentar(
            @PathVariable Long komentarId,
            @RequestBody String kontenBaru) {
        try {
            KomentarBerita komentar = komentarService.updateKomentar(komentarId, kontenBaru);
            return ResponseEntity.ok(komentar);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{komentarId}")
    public ResponseEntity<Void> hapusKomentar(@PathVariable Long komentarId) {
        try {
            komentarService.hapusKomentar(komentarId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/berita/{beritaId}/count")
    public ResponseEntity<Long> hitungTotalKomentar(@PathVariable Long beritaId) {
        long total = komentarService.hitungTotalKomentar(beritaId);
        return ResponseEntity.ok(total);
    }

    @GetMapping("/{komentarId}")
    public ResponseEntity<KomentarBerita> getKomentarById(@PathVariable Long komentarId) {
        try {
            KomentarBerita komentar = komentarService.getKomentarById(komentarId);
            return ResponseEntity.ok(komentar);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
