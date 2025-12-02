package com.shadcn.backend.controller;

import com.shadcn.backend.dto.CommentRequest;
import com.shadcn.backend.dto.CommentResponse;
import com.shadcn.backend.model.KomentarBerita;
import com.shadcn.backend.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
@CrossOrigin(origins = "${frontend.url}")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @PostMapping
    public ResponseEntity<CommentResponse> createComment(@Valid @RequestBody CommentRequest request) {
        try {
            CommentResponse comment = commentService.createComment(request);
            return ResponseEntity.ok(comment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/berita/{beritaId}")
    public ResponseEntity<List<CommentResponse>> getCommentsByBerita(@PathVariable Long beritaId) {
        List<CommentResponse> comments = commentService.getCommentsByBerita(beritaId);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/berita/{beritaId}/paginated")
    public ResponseEntity<Page<CommentResponse>> getCommentsByBeritaPaginated(
            @PathVariable Long beritaId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<CommentResponse> commentsPage = commentService.getCommentsByBeritaPaginated(beritaId, pageable);
        return ResponseEntity.ok(commentsPage);
    }    @PostMapping("/{commentId}/like")
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
            
            CommentResponse comment = commentService.likeComment(commentId, biografiId, userName);
            return ResponseEntity.ok(comment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Gagal menyukai komentar: " + e.getMessage()));
        }
    }

    @PostMapping("/{commentId}/dislike")
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
            
            CommentResponse comment = commentService.dislikeComment(commentId, biografiId, userName);
            return ResponseEntity.ok(comment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Gagal memberikan dislike: " + e.getMessage()));
        }
    }@PostMapping("/{commentId}/reply")
    public ResponseEntity<CommentResponse> replyToComment(
            @PathVariable Long commentId,
            @RequestBody CommentRequest request) {
        try {
            CommentResponse reply = commentService.replyToComment(commentId, request);
            return ResponseEntity.ok(reply);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{commentId}/replies")
    public ResponseEntity<List<CommentResponse>> getCommentReplies(@PathVariable Long commentId) {
        List<CommentResponse> replies = commentService.getCommentReplies(commentId);
        return ResponseEntity.ok(replies);
    }

    @GetMapping("/berita/{beritaId}/count")
    public ResponseEntity<Map<String, Long>> getCommentCount(@PathVariable Long beritaId) {
        long count = commentService.getCommentCount(beritaId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable Long commentId,
            @RequestBody Map<String, String> request) {
        try {
            String content = request.get("konten");
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            CommentResponse comment = commentService.updateComment(commentId, content);
            return ResponseEntity.ok(comment);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        try {
            commentService.deleteComment(commentId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{commentId}")
    public ResponseEntity<CommentResponse> getCommentById(@PathVariable Long commentId) {
        try {
            CommentResponse comment = commentService.getCommentById(commentId);
            return ResponseEntity.ok(comment);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
