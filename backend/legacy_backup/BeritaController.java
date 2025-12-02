package com.shadcn.backend.controller;

import com.shadcn.backend.dto.BeritaDetailDto;
import com.shadcn.backend.dto.BeritaRequest;
import com.shadcn.backend.dto.BeritaFilterRequest;
import com.shadcn.backend.dto.BeritaSummaryDto;
import com.shadcn.backend.dto.CommentRequest;
import com.shadcn.backend.dto.CommentResponse;
import com.shadcn.backend.model.Berita;
import com.shadcn.backend.service.BeritaService;
import com.shadcn.backend.service.CommentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/berita")
@CrossOrigin(origins = "${frontend.url}")
@RequiredArgsConstructor
public class BeritaController {

    private final BeritaService beritaService;
    private final CommentService commentService;

    @GetMapping
    public ResponseEntity<Page<BeritaSummaryDto>> getAllBerita(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String kategori,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "tanggalDibuat") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Pageable pageable = PageRequest.of(page, size);
        BeritaFilterRequest filter = new BeritaFilterRequest();
          // Safe enum conversion for kategori
        if (kategori != null && !kategori.equals("ALL")) {
            try {
                filter.setKategori(Berita.KategoriBerita.valueOf(kategori.toUpperCase()));
            } catch (IllegalArgumentException e) {
                // Log warning and ignore invalid kategori
                log.warn("Invalid kategori value: {}, ignoring filter", kategori);
            }
        }
        
        // Safe enum conversion for status
        if (status != null) {
            try {
                filter.setStatus(Berita.StatusBerita.valueOf(status.toUpperCase()));
            } catch (IllegalArgumentException e) {
                // Default to PUBLISHED if invalid status
                filter.setStatus(Berita.StatusBerita.PUBLISHED);
            }
        }
        
        filter.setSearch(search);
        filter.setSortBy(sortBy);
        filter.setSortDir(sortDir);
        
        Page<BeritaSummaryDto> beritaPage = beritaService.getBeritaSummaryWithFilter(filter, pageable);
        return ResponseEntity.ok(beritaPage);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Berita> getBeritaById(@PathVariable Long id) {
        Optional<Berita> berita = beritaService.getBeritaById(id);
        if (berita.isPresent()) {
            // Increment view count
            beritaService.incrementView(id);
            return ResponseEntity.ok(berita.get());
        }
        return ResponseEntity.notFound().build();
    }    @GetMapping("/published")
    public ResponseEntity<Page<BeritaSummaryDto>> getPublishedBerita(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String kategori,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        // Create pageable with proper sorting
        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = Sort.by(direction, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<BeritaSummaryDto> beritaPage = beritaService.getPublishedBeritaSummary(search, kategori, pageable);
        return ResponseEntity.ok(beritaPage);
    }

    @GetMapping("/kategori/{kategori}")
    public ResponseEntity<Page<Berita>> getBeritaByKategori(
            @PathVariable String kategori,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Berita> beritaPage = beritaService.getBeritaByKategori(kategori, pageable);
        return ResponseEntity.ok(beritaPage);
    }    @GetMapping("/popular")
    public ResponseEntity<List<BeritaSummaryDto>> getPopularBerita(
            @RequestParam(defaultValue = "5") int limit) {
        List<BeritaSummaryDto> popularBerita = beritaService.getPopularBeritaSummary(limit);
        return ResponseEntity.ok(popularBerita);
    }

    @PostMapping
    public ResponseEntity<Berita> createBerita(@Valid @RequestBody BeritaRequest request) {
        try {
            Berita berita = beritaService.createBerita(request);
            return ResponseEntity.ok(berita);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Berita> updateBerita(
            @PathVariable Long id, 
            @Valid @RequestBody BeritaRequest request) {
        try {
            Berita berita = beritaService.updateBerita(id, request);
            return ResponseEntity.ok(berita);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBerita(@PathVariable Long id) {
        try {
            beritaService.deleteBerita(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Void> likeBerita(@PathVariable Long id) {
        try {
            beritaService.incrementLike(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Berita> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            Berita berita = beritaService.updateStatus(id, status);
            return ResponseEntity.ok(berita);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Berita>> searchBerita(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Berita> results = beritaService.searchBerita(query, pageable);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<BeritaDetailDto> getBeritaDetailById(@PathVariable Long id) {
        Optional<BeritaDetailDto> beritaDetail = beritaService.getBeritaDetailById(id);
        if (beritaDetail.isPresent()) {
            // Increment view count
            beritaService.incrementView(id);
            return ResponseEntity.ok(beritaDetail.get());
        }
        return ResponseEntity.notFound().build();
    }

    // Comment endpoints
    @PostMapping("/{id}/komentar")
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
              CommentRequest commentRequest = new CommentRequest();
            commentRequest.setBeritaId(id);
            commentRequest.setNama(namaPengguna.trim());
            commentRequest.setKonten(konten.trim());
            commentRequest.setBiografiId(biografiId);
              CommentResponse savedComment = commentService.createComment(commentRequest);
            
            return ResponseEntity.ok(savedComment);
        } catch (Exception e) {
            log.error("Error adding comment: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Gagal menambahkan komentar: " + e.getMessage()));
        }
    }

    @PostMapping("/komentar/{parentId}/reply")
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
            
            CommentRequest replyRequest = new CommentRequest();
            replyRequest.setNama(namaPengguna.trim());
            replyRequest.setKonten(konten.trim());
            replyRequest.setBiografiId(biografiId);
              CommentResponse savedReply = commentService.replyToComment(parentId, replyRequest);
            
            return ResponseEntity.ok(savedReply);
        } catch (Exception e) {
            log.error("Error replying to comment: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Gagal membalas komentar: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/komentar")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long id) {
        try {
            List<CommentResponse> comments = commentService.getCommentsByBerita(id);
            return ResponseEntity.ok(comments);
        } catch (Exception e) {
            log.error("Error getting comments for berita " + id, e);
            return ResponseEntity.badRequest().build();
        }
    }

    // Like a comment
    @PostMapping("/komentar/{commentId}/like")
    public ResponseEntity<?> likeComment(
            @PathVariable Long commentId,
            @RequestBody Map<String, Object> request) {
        
        try {
            Long biografiId = request.get("biografiId") != null ? 
                ((Number) request.get("biografiId")).longValue() : null;
            String userName = (String) request.get("userName");
            
            if (biografiId == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "BiografiId tidak boleh kosong"));
            }
            
            if (userName == null || userName.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Nama pengguna tidak boleh kosong"));
            }
              CommentResponse comment = commentService.likeComment(commentId, biografiId, userName);
            
            return ResponseEntity.ok(comment);
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
                ((Number) request.get("biografiId")).longValue() : null;
            String userName = (String) request.get("userName");
            
            if (biografiId == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "BiografiId tidak boleh kosong"));
            }
            
            if (userName == null || userName.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Nama pengguna tidak boleh kosong"));
            }
              CommentResponse comment = commentService.dislikeComment(commentId, biografiId, userName);
            
            return ResponseEntity.ok(comment);
        } catch (Exception e) {
            log.error("Error disliking comment: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Gagal memberikan dislike: " + e.getMessage()));
        }
    }
}
