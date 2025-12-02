package com.shadcn.backend.service;

import com.shadcn.backend.dto.*;
import com.shadcn.backend.model.*;
import com.shadcn.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class KomunikasiService {

    @Autowired
    private PostKomunikasiRepository postRepository;
    
    @Autowired
    private PostReactionRepository postReactionRepository;
    
    @Autowired
    private PostCommentRepository commentRepository;
    
    @Autowired
    private CommentReactionRepository commentReactionRepository;
    
    @Autowired
    private MediaPostRepository mediaRepository;
    
    @Autowired
    private BiografiRepository biografiRepository;

    // ========== POST OPERATIONS ==========
    
    /**
     * Get feed posts (latest posts)
     */
    public Page<PostKomunikasiDTO> getFeedPosts(Pageable pageable, Long currentUserId) {
        Page<PostKomunikasi> posts = postRepository.findActivePosts(PostKomunikasi.StatusPost.AKTIF, pageable);
        return posts.map(post -> convertToPostDTO(post, currentUserId));
    }
    
    /**
     * Get popular posts (high engagement)
     */
    public Page<PostKomunikasiDTO> getPopularPosts(Pageable pageable, Long currentUserId) {
        Page<PostKomunikasi> posts = postRepository.findPopularPosts(pageable);
        return posts.map(post -> convertToPostDTO(post, currentUserId));
    }
    
    /**
     * Get trending posts (recent high engagement)
     */
    public Page<PostKomunikasiDTO> getTrendingPosts(Pageable pageable, Long currentUserId) {
        LocalDateTime oneWeekAgo = LocalDateTime.now().minusWeeks(1);
        Page<PostKomunikasi> posts = postRepository.findTrendingPosts(oneWeekAgo, pageable);
        return posts.map(post -> convertToPostDTO(post, currentUserId));
    }
    
    /**
     * Search posts
     */
    public Page<PostKomunikasiDTO> searchPosts(String keyword, Pageable pageable, Long currentUserId) {
        Page<PostKomunikasi> posts = postRepository.searchPosts(keyword, pageable);
        return posts.map(post -> convertToPostDTO(post, currentUserId));
    }
    
    /**
     * Get posts by user
     */
    public Page<PostKomunikasiDTO> getPostsByUser(Long biografiId, Pageable pageable, Long currentUserId) {
        Page<PostKomunikasi> posts = postRepository.findByBiografiIdAndActive(biografiId, PostKomunikasi.StatusPost.AKTIF, pageable);
        return posts.map(post -> convertToPostDTO(post, currentUserId));
    }
      /**
     * Get single post by ID
     */
    public Optional<PostKomunikasiDTO> getPostById(Long postId, Long currentUserId) {
        Optional<PostKomunikasi> post = postRepository.findActiveById(postId, PostKomunikasi.StatusPost.AKTIF);
        return post.map(p -> convertToPostDTO(p, currentUserId));
    }
    
    /**
     * Create new post
     */
    public PostKomunikasiDTO createPost(CreatePostRequest request, Long biografiId) {
        // Get biografi
        Biografi biografi = biografiRepository.findById(biografiId)
            .orElseThrow(() -> new RuntimeException("Biografi not found"));
        
        // Create post
        PostKomunikasi post = new PostKomunikasi();
        post.setKonten(request.getKonten());
        post.setBiografi(biografi);
          // Save post first
        PostKomunikasi savedPost = postRepository.save(post);
        
        // Create media if any
        if (request.getMedia() != null && !request.getMedia().isEmpty()) {
            List<MediaPost> mediaList = request.getMedia().stream()
                .map(mediaDTO -> {
                    MediaPost media = new MediaPost();
                    media.setPostKomunikasi(savedPost);
                    media.setMediaUrl(mediaDTO.getMediaUrl());
                    media.setMediaType(MediaPost.MediaType.valueOf(mediaDTO.getMediaType()));
                    media.setMediaOrder(mediaDTO.getMediaOrder());
                    media.setCaption(mediaDTO.getCaption());
                    media.setOriginalFileName(mediaDTO.getOriginalFileName());
                    media.setFileSize(mediaDTO.getFileSize());
                    media.setMimeType(mediaDTO.getMimeType());
                    media.setThumbnailUrl(mediaDTO.getThumbnailUrl());
                    return media;
                })
                .collect(Collectors.toList());
              mediaRepository.saveAll(mediaList);
            savedPost.setMedia(mediaList);
        }
        
        return convertToPostDTO(savedPost, biografiId);
    }
      /**
     * Delete post
     */
    public boolean deletePost(Long postId, Long biografiId) {
        Optional<PostKomunikasi> postOpt = postRepository.findActiveById(postId, PostKomunikasi.StatusPost.AKTIF);
        if (postOpt.isPresent()) {
            PostKomunikasi post = postOpt.get();
            // Check if user owns the post
            if (post.getBiografiId().equals(biografiId)) {
                post.setStatus(PostKomunikasi.StatusPost.DIHAPUS);
                postRepository.save(post);
                return true;
            }
        }
        return false;
    }

    // ========== REACTION OPERATIONS ==========
      /**
     * Toggle reaction on post
     */
    public PostKomunikasiDTO togglePostReaction(Long postId, String reactionType, Long biografiId) {
        PostKomunikasi post = postRepository.findActiveById(postId, PostKomunikasi.StatusPost.AKTIF)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        
        Biografi biografi = biografiRepository.findById(biografiId)
            .orElseThrow(() -> new RuntimeException("Biografi not found"));
        
        Optional<PostReaction> existingReaction = postReactionRepository
            .findByPostIdAndBiografiId(postId, biografiId);
        
        if (existingReaction.isPresent()) {
            PostReaction reaction = existingReaction.get();
            
            if (reaction.getReactionType().toString().equals(reactionType)) {
                // Remove reaction if same type
                postReactionRepository.delete(reaction);
                updatePostReactionCounts(post);            } else {
                // Update reaction type
                reaction.setReactionType(PostReaction.ReactionType.valueOf(reactionType));
                postReactionRepository.save(reaction);
                updatePostReactionCounts(post);
            }
        } else {
            // Create new reaction
            PostReaction reaction = new PostReaction();
            reaction.setPostKomunikasi(post);
            reaction.setBiografi(biografi);
            reaction.setReactionType(PostReaction.ReactionType.valueOf(reactionType));
            postReactionRepository.save(reaction);
            updatePostReactionCounts(post);
        }
        
        return convertToPostDTO(post, biografiId);
    }
    
    /**
     * Get reactions for a post
     */
    public List<ReactionSummaryDTO> getPostReactions(Long postId) {
        List<Object[]> reactionCounts = postReactionRepository.countReactionsByType(postId);
        return reactionCounts.stream()
            .map(result -> {
                PostReaction.ReactionType type = (PostReaction.ReactionType) result[0];
                Long count = (Long) result[1];
                return new ReactionSummaryDTO(type.toString(), type.getEmoji(), count.intValue());
            })
            .collect(Collectors.toList());
    }

    // ========== COMMENT OPERATIONS ==========
    
    /**
     * Get comments for a post
     */
    public Page<PostCommentDTO> getPostComments(Long postId, Pageable pageable, Long currentUserId) {
        Page<PostComment> comments = commentRepository.findTopLevelCommentsByPostId(postId, pageable);
        List<PostCommentDTO> commentDTOs = comments.getContent().stream()
            .map(comment -> convertToCommentDTO(comment, currentUserId))
            .collect(Collectors.toList());
        
        return new PageImpl<>(commentDTOs, pageable, comments.getTotalElements());
    }
    
    /**
     * Get replies for a comment
     */
    public List<PostCommentDTO> getCommentReplies(Long commentId, Long currentUserId) {
        List<PostComment> replies = commentRepository.findRepliesByParentCommentId(commentId);
        return replies.stream()
            .map(reply -> convertToCommentDTO(reply, currentUserId))
            .collect(Collectors.toList());
    }
      /**
     * Create new comment
     */
    public PostCommentDTO createComment(Long postId, CreateCommentRequest request, Long biografiId) {
        PostKomunikasi post = postRepository.findActiveById(postId, PostKomunikasi.StatusPost.AKTIF)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        
        Biografi biografi = biografiRepository.findById(biografiId)
            .orElseThrow(() -> new RuntimeException("Biografi not found"));
        
        PostComment comment = new PostComment();
        comment.setPostKomunikasi(post);
        comment.setBiografi(biografi);
        comment.setKonten(request.getKonten());
        
        if (request.getParentCommentId() != null) {
            PostComment parentComment = commentRepository.findActiveById(request.getParentCommentId())
                .orElseThrow(() -> new RuntimeException("Parent comment not found"));
            comment.setParentComment(parentComment);
        }
        
        comment = commentRepository.save(comment);
        
        // Update post comment count
        post.incrementCommentCount();
        postRepository.save(post);
        
        // Update parent comment reply count if this is a reply
        if (request.getParentCommentId() != null) {
            PostComment parentComment = commentRepository.findById(request.getParentCommentId()).get();
            parentComment.incrementReplyCount();
            commentRepository.save(parentComment);
        }
        
        return convertToCommentDTO(comment, biografiId);
    }
    
    /**
     * Delete comment
     */
    public boolean deleteComment(Long commentId, Long biografiId) {
        Optional<PostComment> commentOpt = commentRepository.findActiveById(commentId);
        if (commentOpt.isPresent()) {
            PostComment comment = commentOpt.get();
            // Check if user owns the comment
            if (comment.getBiografiId().equals(biografiId)) {
                comment.setStatus(PostComment.StatusComment.DIHAPUS);
                commentRepository.save(comment);
                
                // Update post comment count
                PostKomunikasi post = postRepository.findById(comment.getPostId()).get();
                post.decrementCommentCount();
                postRepository.save(post);
                
                return true;
            }
        }
        return false;
    }
    
    /**
     * Toggle reaction on comment
     */
    public PostCommentDTO toggleCommentReaction(Long commentId, String reactionType, Long biografiId) {
        PostComment comment = commentRepository.findActiveById(commentId)
            .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        Biografi biografi = biografiRepository.findById(biografiId)
            .orElseThrow(() -> new RuntimeException("Biografi not found"));
        
        Optional<CommentReaction> existingReaction = commentReactionRepository
            .findByCommentIdAndBiografiId(commentId, biografiId);
        
        if (existingReaction.isPresent()) {
            CommentReaction reaction = existingReaction.get();
            
            if (reaction.getReactionType().toString().equals(reactionType)) {
                // Remove reaction if same type
                commentReactionRepository.delete(reaction);
                updateCommentReactionCounts(comment);
            } else {
                // Update reaction type
                reaction.setReactionType(CommentReaction.ReactionType.valueOf(reactionType));
                commentReactionRepository.save(reaction);
                updateCommentReactionCounts(comment);
            }
        } else {
            // Create new reaction
            CommentReaction reaction = new CommentReaction();
            reaction.setPostComment(comment);
            reaction.setBiografi(biografi);
            reaction.setReactionType(CommentReaction.ReactionType.valueOf(reactionType));
            commentReactionRepository.save(reaction);
            updateCommentReactionCounts(comment);
        }
        
        return convertToCommentDTO(comment, biografiId);
    }

    // ========== UTILITY METHODS ==========
    
    /**
     * Convert PostKomunikasi to PostKomunikasiDTO
     */
    private PostKomunikasiDTO convertToPostDTO(PostKomunikasi post, Long currentUserId) {
        PostKomunikasiDTO dto = new PostKomunikasiDTO();
        dto.setPostId(post.getPostId());        dto.setKonten(post.getKonten());
        dto.setBiografiId(post.getBiografiId());
        dto.setAuthorName(post.getAuthorName());
          // Always get fresh photo from biografi for posts
        if (post.getBiografi() != null && post.getBiografi().getFoto() != null) {
            dto.setAuthorPhoto(post.getBiografi().getFoto());
        } else if (post.getBiografi() != null && post.getBiografi().getFotoProfil() != null) {
            dto.setAuthorPhoto(post.getBiografi().getFotoProfil());
        } else {
            dto.setAuthorPhoto(post.getAuthorPhoto()); // fallback to cached photo
        }
        
        dto.setAuthorJurusan(post.getAuthorJurusan());
        dto.setAuthorAlumniTahun(post.getAuthorAlumniTahun());
        dto.setLikeCount(post.getLikeCount());
        dto.setDislikeCount(post.getDislikeCount());
        dto.setCommentCount(post.getCommentCount());
        dto.setStatus(post.getStatus().toString());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setUpdatedAt(post.getUpdatedAt());
        
        // Get media
        List<MediaPost> media = mediaRepository.findByPostIdOrderByOrder(post.getPostId());
        dto.setMedia(media.stream()
            .map(this::convertToMediaDTO)
            .collect(Collectors.toList()));
        
        // Get user's reaction
        if (currentUserId != null) {
            Optional<PostReaction> userReaction = postReactionRepository
                .findByPostIdAndBiografiId(post.getPostId(), currentUserId);
            userReaction.ifPresent(reaction -> dto.setUserReaction(reaction.getReactionType().toString()));
        }
        
        // Get recent reactions
        List<PostReaction> recentReactions = postReactionRepository
            .findRecentReactionsByPostId(post.getPostId(), 
                org.springframework.data.domain.PageRequest.of(0, 5));
        dto.setRecentReactions(recentReactions.stream()
            .map(reaction -> new ReactionSummaryDTO(
                reaction.getReactionType().toString(),
                reaction.getReactionType().getEmoji(),
                reaction.getUserName(),
                null
            ))
            .collect(Collectors.toList()));
        
        // Get recent comments
        List<PostComment> recentComments = commentRepository
            .findRecentCommentsByPostId(post.getPostId(),
                org.springframework.data.domain.PageRequest.of(0, 3));
        dto.setRecentComments(recentComments.stream()
            .map(comment -> convertToCommentDTO(comment, currentUserId))
            .collect(Collectors.toList()));
        
        return dto;
    }
      /**
     * Convert PostComment to PostCommentDTO
     */
    private PostCommentDTO convertToCommentDTO(PostComment comment, Long currentUserId) {
        PostCommentDTO dto = new PostCommentDTO();
        dto.setCommentId(comment.getCommentId());
        dto.setPostId(comment.getPostId());
        dto.setBiografiId(comment.getBiografiId());
        dto.setParentCommentId(comment.getParentCommentId());
        dto.setAuthorName(comment.getAuthorName());          // Always get fresh photo from biografi for comments
        if (comment.getBiografi() != null && comment.getBiografi().getFoto() != null) {
            dto.setAuthorPhoto(comment.getBiografi().getFoto());
        } else if (comment.getBiografi() != null && comment.getBiografi().getFotoProfil() != null) {
            dto.setAuthorPhoto(comment.getBiografi().getFotoProfil());
        } else {
            dto.setAuthorPhoto(comment.getAuthorPhoto()); // fallback to cached photo
        }
        
        dto.setAuthorJurusan(comment.getAuthorJurusan());
        dto.setAuthorAlumniTahun(comment.getAuthorAlumniTahun());
        dto.setKonten(comment.getKonten());
        dto.setLikeCount(comment.getLikeCount());
        dto.setDislikeCount(comment.getDislikeCount());
        dto.setReplyCount(comment.getReplyCount());
        dto.setStatus(comment.getStatus().toString());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUpdatedAt(comment.getUpdatedAt());
        
        // Get user's reaction
        if (currentUserId != null) {
            Optional<CommentReaction> userReaction = commentReactionRepository
                .findByCommentIdAndBiografiId(comment.getCommentId(), currentUserId);
            userReaction.ifPresent(reaction -> dto.setUserReaction(reaction.getReactionType().toString()));
        }
        
        return dto;
    }
    
    /**
     * Convert MediaPost to MediaPostDTO
     */
    private MediaPostDTO convertToMediaDTO(MediaPost media) {
        MediaPostDTO dto = new MediaPostDTO();
        dto.setMediaId(media.getMediaId());
        dto.setPostId(media.getPostId());
        dto.setMediaUrl(media.getMediaUrl());
        dto.setMediaType(media.getMediaType().toString());
        dto.setMediaOrder(media.getMediaOrder());
        dto.setCaption(media.getCaption());
        dto.setOriginalFileName(media.getOriginalFileName());
        dto.setFileSize(media.getFileSize());
        dto.setMimeType(media.getMimeType());
        dto.setThumbnailUrl(media.getThumbnailUrl());
        dto.setCreatedAt(media.getCreatedAt());
        return dto;
    }
    
    /**
     * Update post reaction counts
     */
    private void updatePostReactionCounts(PostKomunikasi post) {
        Long likeCount = postReactionRepository.countLikesByPostId(post.getPostId());
        Long dislikeCount = postReactionRepository.countDislikesByPostId(post.getPostId());
        
        post.setLikeCount(likeCount.intValue());
        post.setDislikeCount(dislikeCount.intValue());
        postRepository.save(post);
    }
    
    /**
     * Update comment reaction counts
     */
    private void updateCommentReactionCounts(PostComment comment) {
        Long likeCount = commentReactionRepository.countLikesByCommentId(comment.getCommentId());
        Long dislikeCount = commentReactionRepository.countDislikesByCommentId(comment.getCommentId());
        
        comment.setLikeCount(likeCount.intValue());
        comment.setDislikeCount(dislikeCount.intValue());
        commentRepository.save(comment);
    }
    
    // ========== STATISTICS & UTILITIES ==========
    
    /**
     * Get communication statistics
     */
    public Map<String, Object> getCommunicationStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Total posts
        long totalPosts = postRepository.count();
        stats.put("totalPosts", totalPosts);
        
        // Active members (alumni who have posted)
        long activeMembers = postRepository.countDistinctAuthors();
        stats.put("activeMembers", activeMembers);
        
        // Today's posts
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        long todayPosts = postRepository.countPostsBetween(startOfDay, endOfDay);
        stats.put("todayPosts", todayPosts);
        
        // Online now (simulated - in real app would be based on session data)
        stats.put("onlineNow", Math.max(1, (int)(Math.random() * 20) + 5));
        
        return stats;
    }    /**
     * Get trending topics based on post content
     */
    public List<String> getTrendingTopics() {
        // Get recent posts and extract hashtags/trending terms
        List<PostKomunikasi> recentPosts = postRepository.findTop50ByStatusOrderByCreatedAtDesc(PostKomunikasi.StatusPost.AKTIF);
        
        Map<String, Integer> hashtagCount = new HashMap<>();
        
        for (PostKomunikasi post : recentPosts) {
            String content = post.getKonten().toLowerCase();
            
            // Extract hashtags
            String[] words = content.split("\\s+");
            for (String word : words) {
                if (word.startsWith("#") && word.length() > 1) {
                    hashtagCount.put(word, hashtagCount.getOrDefault(word, 0) + 1);
                }
            }
            
            // Add common trending topics based on content analysis
            if (content.contains("alumni") || content.contains("lulusan")) {
                hashtagCount.put("#Alumni2024", hashtagCount.getOrDefault("#Alumni2024", 0) + 1);
            }
            if (content.contains("kedokteran") || content.contains("dokter") || content.contains("medis")) {
                hashtagCount.put("#Kedokteran", hashtagCount.getOrDefault("#Kedokteran", 0) + 1);
            }
            if (content.contains("networking") || content.contains("koneksi") || content.contains("bertemu")) {
                hashtagCount.put("#Networking", hashtagCount.getOrDefault("#Networking", 0) + 1);
            }
            if (content.contains("karir") || content.contains("kerja") || content.contains("pekerjaan")) {
                hashtagCount.put("#Karir", hashtagCount.getOrDefault("#Karir", 0) + 1);
            }
            if (content.contains("wisuda") || content.contains("graduation")) {
                hashtagCount.put("#Wisuda2024", hashtagCount.getOrDefault("#Wisuda2024", 0) + 1);
            }
        }
        
        // Sort by frequency and return top trending topics
        return hashtagCount.entrySet().stream()
            .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
            .limit(5)
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());
    }
}
