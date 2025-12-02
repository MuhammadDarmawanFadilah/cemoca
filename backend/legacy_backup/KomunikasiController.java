package com.shadcn.backend.controller;

import com.shadcn.backend.dto.*;
import com.shadcn.backend.service.KomunikasiService;
import com.shadcn.backend.service.ImageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/komunikasi")
@RequiredArgsConstructor
public class KomunikasiController {

    private final KomunikasiService komunikasiService;
    private final ImageService imageService;

    // ========== MEDIA UPLOAD ENDPOINT ==========
      /**
     * Upload media for communication posts
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadMedia(
            @RequestParam("file") MultipartFile file) {
        
        try {
            log.debug("Uploading communication media: {}", file.getOriginalFilename());
            String filename = imageService.saveImage(file);
            String mediaUrl = imageService.getImageUrl(filename);
            
            log.info("Communication media uploaded successfully: {}", filename);
            return ResponseEntity.ok(Map.of(
                "filename", filename,
                "url", mediaUrl,
                "message", "Media berhasil diupload"
            ));
        } catch (Exception e) {
            log.error("Failed to upload communication media: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Gagal mengupload media: " + e.getMessage()));
        }
    }

    // ========== POST ENDPOINTS ==========
      /**
     * Get feed posts (latest posts)
     */
    @GetMapping("/feed")
    public ResponseEntity<Page<PostKomunikasiDTO>> getFeedPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long currentUserId) {
        
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<PostKomunikasiDTO> posts = komunikasiService.getFeedPosts(pageable, currentUserId);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            e.printStackTrace();
            // Return empty page instead of error for better user experience
            Pageable pageable = PageRequest.of(page, size);
            return ResponseEntity.ok(Page.empty(pageable));
        }
    }
      /**
     * Get popular posts
     */
    @GetMapping("/popular")
    public ResponseEntity<Page<PostKomunikasiDTO>> getPopularPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long currentUserId) {
        
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<PostKomunikasiDTO> posts = komunikasiService.getPopularPosts(pageable, currentUserId);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            e.printStackTrace();
            Pageable pageable = PageRequest.of(page, size);
            return ResponseEntity.ok(Page.empty(pageable));
        }
    }
      /**
     * Get trending posts
     */
    @GetMapping("/trending")
    public ResponseEntity<Page<PostKomunikasiDTO>> getTrendingPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long currentUserId) {
        
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<PostKomunikasiDTO> posts = komunikasiService.getTrendingPosts(pageable, currentUserId);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            e.printStackTrace();
            Pageable pageable = PageRequest.of(page, size);
            return ResponseEntity.ok(Page.empty(pageable));
        }
    }
    
    /**
     * Search posts
     */
    @GetMapping("/search")
    public ResponseEntity<Page<PostKomunikasiDTO>> searchPosts(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long currentUserId) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<PostKomunikasiDTO> posts = komunikasiService.searchPosts(keyword, pageable, currentUserId);
        return ResponseEntity.ok(posts);
    }
      /**
     * Get posts by user
     */
    @GetMapping("/user/{biografiId}")
    public ResponseEntity<Page<PostKomunikasiDTO>> getPostsByUser(
            @PathVariable Long biografiId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long currentUserId) {
        
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<PostKomunikasiDTO> posts = komunikasiService.getPostsByUser(biografiId, pageable, currentUserId);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            e.printStackTrace();
            Pageable pageable = PageRequest.of(page, size);
            return ResponseEntity.ok(Page.empty(pageable));
        }
    }
    
    /**
     * Get single post by ID
     */
    @GetMapping("/post/{postId}")
    public ResponseEntity<PostKomunikasiDTO> getPostById(
            @PathVariable Long postId,
            @RequestParam(required = false) Long currentUserId) {
        
        return komunikasiService.getPostById(postId, currentUserId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Create new post
     */
    @PostMapping("/post")
    public ResponseEntity<PostKomunikasiDTO> createPost(
            @Valid @RequestBody CreatePostRequest request,
            @RequestParam Long biografiId) {
        
        try {
            PostKomunikasiDTO post = komunikasiService.createPost(request, biografiId);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Delete post
     */
    @DeleteMapping("/post/{postId}")
    public ResponseEntity<Map<String, String>> deletePost(
            @PathVariable Long postId,
            @RequestParam Long biografiId) {
        
        boolean deleted = komunikasiService.deletePost(postId, biografiId);
        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Post berhasil dihapus"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Gagal menghapus post"));
        }
    }

    // ========== REACTION ENDPOINTS ==========
    
    /**
     * Toggle reaction on post
     */
    @PostMapping("/post/{postId}/reaction")
    public ResponseEntity<PostKomunikasiDTO> togglePostReaction(
            @PathVariable Long postId,
            @RequestParam String reactionType,
            @RequestParam Long biografiId) {
        
        try {
            PostKomunikasiDTO post = komunikasiService.togglePostReaction(postId, reactionType, biografiId);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Get reactions for a post
     */
    @GetMapping("/post/{postId}/reactions")
    public ResponseEntity<List<ReactionSummaryDTO>> getPostReactions(@PathVariable Long postId) {
        List<ReactionSummaryDTO> reactions = komunikasiService.getPostReactions(postId);
        return ResponseEntity.ok(reactions);
    }

    // ========== COMMENT ENDPOINTS ==========
    
    /**
     * Get comments for a post
     */
    @GetMapping("/post/{postId}/comments")
    public ResponseEntity<Page<PostCommentDTO>> getPostComments(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long currentUserId) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<PostCommentDTO> comments = komunikasiService.getPostComments(postId, pageable, currentUserId);
        return ResponseEntity.ok(comments);
    }
    
    /**
     * Get replies for a comment
     */
    @GetMapping("/comment/{commentId}/replies")
    public ResponseEntity<List<PostCommentDTO>> getCommentReplies(
            @PathVariable Long commentId,
            @RequestParam(required = false) Long currentUserId) {
        
        List<PostCommentDTO> replies = komunikasiService.getCommentReplies(commentId, currentUserId);
        return ResponseEntity.ok(replies);
    }
      /**
     * Create new comment
     */    
    @PostMapping("/post/{postId}/comment")
    public ResponseEntity<PostCommentDTO> createComment(
            @PathVariable Long postId,
            @Valid @RequestBody CreateCommentRequest request,
            @RequestParam Long biografiId) {
        
        try {
            PostCommentDTO comment = komunikasiService.createComment(postId, request, biografiId);
            return ResponseEntity.ok(comment);
        } catch (Exception e) {
            System.err.println("ERROR in createComment: " + e.getMessage());
            e.printStackTrace(); // Log the actual error
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * Delete comment
     */
    @DeleteMapping("/comment/{commentId}")
    public ResponseEntity<Map<String, String>> deleteComment(
            @PathVariable Long commentId,
            @RequestParam Long biografiId) {
        
        boolean deleted = komunikasiService.deleteComment(commentId, biografiId);
        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Komentar berhasil dihapus"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Gagal menghapus komentar"));
        }
    }
    
    /**
     * Toggle reaction on comment
     */
    @PostMapping("/comment/{commentId}/reaction")
    public ResponseEntity<PostCommentDTO> toggleCommentReaction(
            @PathVariable Long commentId,
            @RequestParam String reactionType,
            @RequestParam Long biografiId) {
        
        try {
            PostCommentDTO comment = komunikasiService.toggleCommentReaction(commentId, reactionType, biografiId);
            return ResponseEntity.ok(comment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ========== UTILITY ENDPOINTS ==========
    
    /**
     * Get communication statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        try {
            Map<String, Object> stats = komunikasiService.getCommunicationStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }    /**
     * Get trending topics
     */
    @GetMapping("/trending-topics")
    public ResponseEntity<List<String>> getTrendingTopics() {
        try {
            List<String> trendingTopics = komunikasiService.getTrendingTopics();
            return ResponseEntity.ok(trendingTopics);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Get available reaction types
     */
    @GetMapping("/reactions/types")
    public ResponseEntity<Map<String, String>> getReactionTypes() {
        Map<String, String> reactionTypes = Map.of(
            "LIKE", "👍",
            "DISLIKE", "👎", 
            "LOVE", "❤️",
            "HAHA", "😂",
            "WOW", "😮",
            "SAD", "😢",
            "ANGRY", "😠"
        );
        return ResponseEntity.ok(reactionTypes);
    }
}
