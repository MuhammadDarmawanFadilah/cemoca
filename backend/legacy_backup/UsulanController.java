package com.shadcn.backend.controller;

import com.shadcn.backend.dto.UsulanDetailDto;
import com.shadcn.backend.dto.UsulanSummaryDto;
import com.shadcn.backend.dto.KomentarUsulanDto;
import com.shadcn.backend.model.*;
import com.shadcn.backend.service.UsulanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/usulan")
@CrossOrigin(origins = "${frontend.url}")
@RequiredArgsConstructor
@Slf4j
public class UsulanController {

    private final UsulanService usulanService;    @GetMapping
    public ResponseEntity<Page<UsulanSummaryDto>> getActiveUsulan(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String judul,
            @RequestParam(required = false) String namaPengusul,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tanggalMulaiFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tanggalMulaiTo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tanggalSelesaiFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tanggalSelesaiTo,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        
        Page<UsulanSummaryDto> usulan = usulanService.getActiveUsulanSummary(
            page, size, search, judul, namaPengusul, status,
            tanggalMulaiFrom, tanggalMulaiTo, tanggalSelesaiFrom, tanggalSelesaiTo,
            sortBy, sortDirection
        );
        return ResponseEntity.ok(usulan);
    }

    @GetMapping("/pelaksanaan")
    public ResponseEntity<Page<Usulan>> getUsulanForPelaksanaan(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<Usulan> usulan = usulanService.getUsulanForPelaksanaan(page, size);
        return ResponseEntity.ok(usulan);
    }

    @GetMapping("/dengan-pelaksanaan")
    public ResponseEntity<Page<Usulan>> getUsulanWithPelaksanaan(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<Usulan> usulan = usulanService.getUsulanWithPelaksanaan(page, size);
        return ResponseEntity.ok(usulan);
    }    @GetMapping("/{id}")
    public ResponseEntity<UsulanDetailDto> getUsulanById(@PathVariable Long id) {
        Optional<UsulanDetailDto> usulan = usulanService.getUsulanDetailById(id);
        return usulan.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> createUsulan(
            @RequestParam("judul") String judul,
            @RequestParam("rencanaKegiatan") String rencanaKegiatan,
            @RequestParam("tanggalMulai") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tanggalMulai,
            @RequestParam("tanggalSelesai") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tanggalSelesai,
            @RequestParam("durasiUsulan") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate durasiUsulan,
            @RequestParam("namaPengusul") String namaPengusul,
            @RequestParam("emailPengusul") String emailPengusul,
            @RequestParam(value = "gambar", required = false) MultipartFile gambar) {
        
        try {
            // Debug logging
            log.info("Creating usulan with data:");
            log.info("judul: {}", judul);
            log.info("rencanaKegiatan: {}", rencanaKegiatan != null ? "NOT NULL (" + rencanaKegiatan.length() + " chars)" : "NULL");
            log.info("tanggalMulai: {}", tanggalMulai);
            log.info("tanggalSelesai: {}", tanggalSelesai);
            log.info("durasiUsulan: {}", durasiUsulan);
            log.info("namaPengusul: {}", namaPengusul);
            log.info("emailPengusul: {}", emailPengusul);
            
            // Validation
            if (tanggalMulai.isAfter(tanggalSelesai)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Tanggal mulai tidak boleh setelah tanggal selesai"));
            }
            
            if (durasiUsulan.isBefore(LocalDate.now())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Durasi usulan tidak boleh kurang dari hari ini"));
            }

            Usulan usulan = new Usulan();
            usulan.setJudul(judul);
            usulan.setRencanaKegiatan(rencanaKegiatan);
            usulan.setTanggalMulai(tanggalMulai);
            usulan.setTanggalSelesai(tanggalSelesai);
            usulan.setDurasiUsulan(durasiUsulan);
            usulan.setNamaPengusul(namaPengusul);
            usulan.setEmailPengusul(emailPengusul);

            log.info("Usulan object before save - rencanaKegiatan: {}", 
                    usulan.getRencanaKegiatan() != null ? "NOT NULL" : "NULL");

            Usulan savedUsulan = usulanService.createUsulan(usulan, gambar);
            return ResponseEntity.ok(savedUsulan);
        } catch (Exception e) {
            log.error("Error creating usulan: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<?> voteUsulan(
            @PathVariable Long id,
            @RequestParam String emailVoter,
            @RequestParam String namaVoter,
            @RequestParam VoteUsulan.TipeVote tipeVote) {
        
        try {
            usulanService.voteUsulan(id, emailVoter, namaVoter, tipeVote);
            return ResponseEntity.ok(Map.of("message", "Vote berhasil"));
        } catch (Exception e) {
            log.error("Error voting usulan: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/user-vote")
    public ResponseEntity<VoteUsulan> getUserVote(
            @PathVariable Long id,
            @RequestParam String emailVoter) {
        
        Optional<VoteUsulan> vote = usulanService.getUserVote(id, emailVoter);
        return vote.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }    @PostMapping("/{id}/komentar")
    public ResponseEntity<?> addComment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
          try {
            String konten = (String) request.get("konten");
            String namaPengguna = (String) request.get("nama"); // Frontend sends "nama"
            // Also try "namaPengguna" field for backward compatibility
            if (namaPengguna == null) {
                namaPengguna = (String) request.get("namaPengguna");
            }
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
            
            KomentarUsulan komentar = new KomentarUsulan();
            komentar.setKonten(konten.trim());
            komentar.setNamaPengguna(namaPengguna.trim());
            komentar.setBiografiId(biografiId);

            KomentarUsulan savedKomentar = usulanService.addComment(id, komentar);
            return ResponseEntity.ok(savedKomentar);
        } catch (Exception e) {
            log.error("Error adding comment: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Gagal menambahkan komentar: " + e.getMessage()));
        }
    }    @PostMapping("/komentar/{parentId}/reply")
    public ResponseEntity<?> replyToComment(
            @PathVariable Long parentId,
            @RequestBody Map<String, Object> request) {
        
        try {
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
            
            KomentarUsulan reply = new KomentarUsulan();
            reply.setKonten(konten.trim());
            reply.setNamaPengguna(namaPengguna.trim());
            reply.setBiografiId(biografiId);

            KomentarUsulan savedReply = usulanService.replyToComment(parentId, reply);
            return ResponseEntity.ok(savedReply);
        } catch (Exception e) {
            log.error("Error replying to comment: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Gagal membalas komentar: " + e.getMessage()));
        }
    }    @GetMapping("/{id}/komentar")
    public ResponseEntity<Page<KomentarUsulanDto>> getComments(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<KomentarUsulanDto> comments = usulanService.getCommentsDto(id, page, size);
        return ResponseEntity.ok(comments);
    }// Like a comment
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
              KomentarUsulan komentar = usulanService.likeComment(commentId, biografiId, userName);
            
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
              KomentarUsulan komentar = usulanService.dislikeComment(commentId, biografiId, userName);
            
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
    
    // Get comment count
    @GetMapping("/{id}/komentar/count")
    public ResponseEntity<Map<String, Object>> getCommentCount(@PathVariable Long id) {
        try {
            long count = usulanService.getCommentCount(id);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            log.error("Error getting comment count: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Move Usulan to Pelaksanaan
    @PostMapping("/{id}/move-to-pelaksanaan")
    public ResponseEntity<?> moveToPelaksanaan(@PathVariable Long id) {
        try {
            Pelaksanaan pelaksanaan = usulanService.moveToPelaksanaan(id);
            return ResponseEntity.ok(Map.of(
                "message", "Usulan berhasil dipindahkan ke pelaksanaan",
                "pelaksanaanId", pelaksanaan.getId()
            ));
        } catch (Exception e) {
            log.error("Error moving usulan to pelaksanaan: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("message", e.getMessage()));
        }
    }
    
    // Update Usulan
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUsulan(
            @PathVariable Long id,
            @RequestParam("judul") String judul,
            @RequestParam("rencanaKegiatan") String rencanaKegiatan,
            @RequestParam("tanggalMulai") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tanggalMulai,
            @RequestParam("tanggalSelesai") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tanggalSelesai,
            @RequestParam("durasiUsulan") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate durasiUsulan,
            @RequestParam(value = "gambar", required = false) MultipartFile gambar) {
        
        try {
            // Validation
            if (tanggalMulai.isAfter(tanggalSelesai)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Tanggal mulai tidak boleh setelah tanggal selesai"));
            }

            Usulan updatedUsulan = usulanService.updateUsulan(id, judul, rencanaKegiatan, 
                                                             tanggalMulai, tanggalSelesai, durasiUsulan, gambar);
            return ResponseEntity.ok(updatedUsulan);
        } catch (Exception e) {
            log.error("Error updating usulan: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("message", e.getMessage()));
        }
    }
}
