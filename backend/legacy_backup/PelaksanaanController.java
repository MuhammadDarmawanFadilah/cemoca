package com.shadcn.backend.controller;

import com.shadcn.backend.model.*;
import com.shadcn.backend.dto.ParticipantSummaryDto;
import com.shadcn.backend.dto.AlumniKehadiranDto;
import com.shadcn.backend.dto.PesertaPelaksanaanDto;
import com.shadcn.backend.dto.DokumentasiSummaryDto;
import com.shadcn.backend.dto.DokumentasiDetailDto;
import com.shadcn.backend.dto.KomentarPelaksanaanDto;
import com.shadcn.backend.dto.PelaksanaanDetailDto;
import com.shadcn.backend.dto.PelaksanaanFullDto;
import com.shadcn.backend.dto.PelaksanaanSummaryDto;
import com.shadcn.backend.service.PelaksanaanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/pelaksanaan")
@CrossOrigin(origins = "${frontend.url}")
@RequiredArgsConstructor
@Slf4j
public class PelaksanaanController {

    private final PelaksanaanService pelaksanaanService;    @GetMapping
    public ResponseEntity<Page<PelaksanaanSummaryDto>> getAllPelaksanaan(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String judul,
            @RequestParam(required = false) String namaPengusul,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tanggalSelesaiFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tanggalSelesaiTo,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {

        Page<PelaksanaanSummaryDto> pelaksanaan = pelaksanaanService.getAllPelaksanaanSummary(
                page, size, judul, namaPengusul, status,
                tanggalSelesaiFrom, tanggalSelesaiTo,
                sortBy, sortDirection
        );
        return ResponseEntity.ok(pelaksanaan);
    }@GetMapping("/{id}")
    public ResponseEntity<PelaksanaanDetailDto> getPelaksanaanById(@PathVariable Long id) {
        Optional<PelaksanaanDetailDto> pelaksanaan = pelaksanaanService.getPelaksanaanDetailById(id);
        return pelaksanaan.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
    }
      @GetMapping("/{id}/full")
    public ResponseEntity<PelaksanaanFullDto> getPelaksanaanByIdFull(@PathVariable Long id) {
        Optional<PelaksanaanFullDto> pelaksanaan = pelaksanaanService.getPelaksanaanFullById(id);
        return pelaksanaan.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
    }    @GetMapping("/usulan/{usulanId}")
    public ResponseEntity<PelaksanaanDetailDto> getPelaksanaanByUsulanId(@PathVariable Long usulanId) {
        Optional<PelaksanaanDetailDto> pelaksanaan = pelaksanaanService.getPelaksanaanDetailByUsulanId(usulanId);
        return pelaksanaan.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam Pelaksanaan.StatusPelaksanaan status,
            @RequestParam(required = false) String catatan) {

        try {
            pelaksanaanService.updateStatus(id, status, catatan);
            // Return updated DTO instead of entity
            Optional<PelaksanaanDetailDto> updatedPelaksanaan = pelaksanaanService.getPelaksanaanDetailById(id);
            return updatedPelaksanaan.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error updating pelaksanaan status: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }    @PostMapping("/{id}/dokumentasi")
    public ResponseEntity<?> addDokumentasi(
            @PathVariable Long id,
            @RequestParam(required = false) String judul,
            @RequestParam(required = false) String deskripsi,
            @RequestParam String namaUploader,
            @RequestParam(required = false) String emailUploader,
            @RequestParam(value = "foto", required = false) MultipartFile foto) {

        try {
            DokumentasiPelaksanaan dokumentasi = pelaksanaanService.addDokumentasi(
                    id, judul, deskripsi, namaUploader, emailUploader, foto);
            // Return DTO instead of entity
            return ResponseEntity.ok(new DokumentasiDetailDto(dokumentasi));
        } catch (Exception e) {
            log.error("Error adding dokumentasi: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }@GetMapping("/{id}/dokumentasi")
    public ResponseEntity<List<DokumentasiSummaryDto>> getDokumentasiSummary(@PathVariable Long id) {
        List<DokumentasiSummaryDto> dokumentasi = pelaksanaanService.getDokumentasiSummary(id);
        return ResponseEntity.ok(dokumentasi);
    }
      @GetMapping("/{id}/dokumentasi/full")
    public ResponseEntity<List<DokumentasiDetailDto>> getDokumentasiDetail(@PathVariable Long id) {
        List<DokumentasiDetailDto> dokumentasi = pelaksanaanService.getDokumentasiDetail(id);
        return ResponseEntity.ok(dokumentasi);
    }

    @DeleteMapping("/dokumentasi/{dokumentasiId}")
    public ResponseEntity<?> deleteDokumentasi(@PathVariable Long dokumentasiId) {
        try {
            pelaksanaanService.deleteDokumentasi(dokumentasiId);
            return ResponseEntity.ok(Map.of("message", "Dokumentasi berhasil dihapus"));
        } catch (Exception e) {
            log.error("Error deleting dokumentasi: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }    @PostMapping("/{id}/komentar")
    public ResponseEntity<?> addComment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {

        try {
            String konten = (String) request.get("konten");
            String namaPengguna = (String) request.get("nama"); // Frontend sends "nama"
            Long biografiId = request.get("biografiId") != null ? 
                ((Number) request.get("biografiId")).longValue() : null;
            
            if (konten == null || konten.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Konten komentar tidak boleh kosong"));
            }
            
            if (namaPengguna == null || namaPengguna.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Nama pengguna tidak boleh kosong"));
            }
            
            KomentarPelaksanaan komentar = new KomentarPelaksanaan();
            komentar.setKonten(konten.trim());
            komentar.setNamaPengguna(namaPengguna.trim());
            komentar.setBiografiId(biografiId);
            
            KomentarPelaksanaan savedKomentar = pelaksanaanService.addComment(id, komentar);
            
            // Return DTO instead of entity
            return ResponseEntity.ok(new KomentarPelaksanaanDto(
                savedKomentar.getId(),
                savedKomentar.getKonten(),
                savedKomentar.getNamaPengguna(),
                savedKomentar.getBiografiId(),
                savedKomentar.getTanggalKomentar(),
                savedKomentar.getUpdatedAt(),
                savedKomentar.getLikes(),
                savedKomentar.getDislikes()
            ));
        } catch (Exception e) {
            log.error("Error adding comment: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Gagal menambahkan komentar: " + e.getMessage()));
        }
    }    @PostMapping("/komentar/{parentId}/reply")
    public ResponseEntity<?> replyToComment(
            @PathVariable Long parentId,
            @RequestBody Map<String, Object> request) {        try {
            String konten = (String) request.get("konten");
            String namaPengguna = (String) request.get("namaPengguna");
            // Also try 'nama' field for compatibility
            if (namaPengguna == null) {
                namaPengguna = (String) request.get("nama");
            }
            Long biografiId = request.get("biografiId") != null ? 
                ((Number) request.get("biografiId")).longValue() : null;
            
            if (konten == null || konten.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Konten balasan tidak boleh kosong"));
            }
            
            if (namaPengguna == null || namaPengguna.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Nama pengguna tidak boleh kosong"));
            }
            
            KomentarPelaksanaan reply = new KomentarPelaksanaan();
            reply.setKonten(konten.trim());
            reply.setNamaPengguna(namaPengguna.trim());
            reply.setBiografiId(biografiId);
            
            KomentarPelaksanaan savedReply = pelaksanaanService.replyToComment(parentId, reply);
            
            // Return DTO instead of entity
            return ResponseEntity.ok(new KomentarPelaksanaanDto(
                savedReply.getId(),
                savedReply.getKonten(),
                savedReply.getNamaPengguna(),
                savedReply.getBiografiId(),
                savedReply.getTanggalKomentar(),
                savedReply.getUpdatedAt(),
                savedReply.getLikes(),
                savedReply.getDislikes()
            ));
        } catch (Exception e) {
            log.error("Error replying to comment: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Gagal membalas komentar: " + e.getMessage()));
        }
    }@GetMapping("/{id}/komentar")
    public ResponseEntity<Page<KomentarPelaksanaanDto>> getComments(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<KomentarPelaksanaanDto> comments = pelaksanaanService.getCommentsDto(id, page, size);
        return ResponseEntity.ok(comments);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePelaksanaan(
            @PathVariable Long id,
            @RequestParam(required = false) String judulKegiatan,
            @RequestParam(required = false) String deskripsi,
            @RequestParam(required = false) String lokasiPelaksanaan,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tanggalMulai,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tanggalSelesai,
            @RequestParam(required = false) String jumlahPeserta,
            @RequestParam(required = false) String targetPeserta,
            @RequestParam(required = false) String catatanPelaksanaan,
            @RequestParam(value = "foto", required = false) MultipartFile foto) {        try {
            pelaksanaanService.updatePelaksanaan(
                    id, judulKegiatan, deskripsi, lokasiPelaksanaan,
                    tanggalMulai, tanggalSelesai, jumlahPeserta, targetPeserta,
                    catatanPelaksanaan, foto);
            // Return updated DTO instead of entity
            Optional<PelaksanaanDetailDto> updatedPelaksanaan = pelaksanaanService.getPelaksanaanDetailById(id);
            return updatedPelaksanaan.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error updating pelaksanaan: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }
      // Alumni Participants endpoints
      @PostMapping("/{id}/participants")
    public ResponseEntity<?> saveAlumniPeserta(
            @PathVariable Long id,
            @RequestBody List<AlumniKehadiran> alumniPeserta) {
          try {
            pelaksanaanService.saveAlumniPeserta(id, alumniPeserta);
            // Return DTO instead of entity to avoid lazy loading
            List<ParticipantSummaryDto> result = pelaksanaanService.getAlumniPesertaSummary(id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error saving alumni peserta: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }
    
    @GetMapping("/{id}/participants")
    public ResponseEntity<List<ParticipantSummaryDto>> getAlumniPesertaSummary(@PathVariable Long id) {
        List<ParticipantSummaryDto> peserta = pelaksanaanService.getAlumniPesertaSummary(id);
        return ResponseEntity.ok(peserta);
    }    @GetMapping("/{id}/participants/full")
    public ResponseEntity<Map<String, Object>> getAlumniPesertaWithBiografi(@PathVariable Long id) {
        List<PesertaPelaksanaanDto> peserta = pelaksanaanService.getPesertaPelaksanaanNested(id);
        Map<String, Object> response = new HashMap<>();
        response.put("value", peserta);
        response.put("Count", peserta.size());
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{id}/participants/{biografiId}")
    public ResponseEntity<?> updateAlumniKehadiran(
            @PathVariable Long id,
            @PathVariable Long biografiId,
            @RequestParam Boolean hadir,
            @RequestParam(required = false) String catatan) {
          try {
            pelaksanaanService.updateAlumniKehadiran(id, biografiId, hadir, catatan);
            // Return updated participants list as DTO
            List<ParticipantSummaryDto> result = pelaksanaanService.getAlumniPesertaSummary(id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error updating alumni kehadiran: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // OPTIMIZED endpoint - returns summary DTOs to avoid N+1 queries
    @GetMapping("/summary")
    public ResponseEntity<Page<PelaksanaanSummaryDto>> getAllPelaksanaanSummary(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String judul,
            @RequestParam(required = false) String namaPengusul,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tanggalSelesaiFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tanggalSelesaiTo,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {

        Page<PelaksanaanSummaryDto> pelaksanaan = pelaksanaanService.getAllPelaksanaanSummary(
                page, size, judul, namaPengusul, status,
                tanggalSelesaiFrom, tanggalSelesaiTo,
                sortBy, sortDirection
        );
        return ResponseEntity.ok(pelaksanaan);
    }    // Like a comment
    @PostMapping("/komentar/{commentId}/like")
    public ResponseEntity<?> likeComment(
            @PathVariable Long commentId,
            @RequestBody Map<String, Object> request) {
        
        try {
            Long biografiId = request.get("biografiId") != null ? 
                Long.valueOf(request.get("biografiId").toString()) : null;
            String userName = (String) request.get("userName");
            
            if (biografiId == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "BiografiId tidak boleh kosong"));
            }
            
            if (userName == null || userName.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Nama pengguna tidak boleh kosong"));
            }
              KomentarPelaksanaan komentar = pelaksanaanService.likeComment(commentId, biografiId, userName);
            
            // Return a success response with like/dislike counts
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "Like berhasil",
                "likes", komentar.getLikes(),
                "dislikes", komentar.getDislikes()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error liking comment: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Gagal menyukai komentar: " + e.getMessage()));
        }
    }

    // Dislike a comment
    @PostMapping("/komentar/{commentId}/dislike")
    public ResponseEntity<?> dislikeComment(
            @PathVariable Long commentId,
            @RequestBody Map<String, Object> request) {
        
        try {
            Long biografiId = request.get("biografiId") != null ? 
                Long.valueOf(request.get("biografiId").toString()) : null;
            String userName = (String) request.get("userName");
            
            if (biografiId == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "BiografiId tidak boleh kosong"));
            }
            
            if (userName == null || userName.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Nama pengguna tidak boleh kosong"));
            }
              KomentarPelaksanaan komentar = pelaksanaanService.dislikeComment(commentId, biografiId, userName);
            
            // Return a success response with like/dislike counts
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "Dislike berhasil",
                "likes", komentar.getLikes(),
                "dislikes", komentar.getDislikes()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error disliking comment: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Gagal memberikan dislike: " + e.getMessage()));
        }
    }
}
