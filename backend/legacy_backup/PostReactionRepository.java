package com.shadcn.backend.repository;

import com.shadcn.backend.model.PostReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostReactionRepository extends JpaRepository<PostReaction, Long> {
    
    // Find user's reaction to a post
    @Query("SELECT r FROM PostReaction r WHERE r.postId = :postId AND r.biografiId = :biografiId")
    Optional<PostReaction> findByPostIdAndBiografiId(@Param("postId") Long postId, @Param("biografiId") Long biografiId);
    
    // Find all reactions for a post
    @Query("SELECT r FROM PostReaction r WHERE r.postId = :postId ORDER BY r.createdAt DESC")
    List<PostReaction> findByPostId(@Param("postId") Long postId);
    
    // Count reactions by type for a post
    @Query("SELECT r.reactionType, COUNT(r) FROM PostReaction r WHERE r.postId = :postId GROUP BY r.reactionType")
    List<Object[]> countReactionsByType(@Param("postId") Long postId);
    
    // Find recent reactions for a post (for display)
    @Query("SELECT r FROM PostReaction r WHERE r.postId = :postId ORDER BY r.createdAt DESC")
    List<PostReaction> findRecentReactionsByPostId(@Param("postId") Long postId, org.springframework.data.domain.Pageable pageable);
    
    // Count likes for a post
    @Query("SELECT COUNT(r) FROM PostReaction r WHERE r.postId = :postId AND r.reactionType = 'LIKE'")
    Long countLikesByPostId(@Param("postId") Long postId);
    
    // Count dislikes for a post
    @Query("SELECT COUNT(r) FROM PostReaction r WHERE r.postId = :postId AND r.reactionType = 'DISLIKE'")
    Long countDislikesByPostId(@Param("postId") Long postId);
    
    // Find users who liked a post
    @Query("SELECT r FROM PostReaction r WHERE r.postId = :postId AND r.reactionType = 'LIKE' ORDER BY r.createdAt DESC")
    List<PostReaction> findLikesByPostId(@Param("postId") Long postId);
    
    // Find all reactions by user
    @Query("SELECT r FROM PostReaction r WHERE r.biografiId = :biografiId ORDER BY r.createdAt DESC")
    List<PostReaction> findByBiografiId(@Param("biografiId") Long biografiId);
    
    // Delete reaction
    void deleteByPostIdAndBiografiId(@Param("postId") Long postId, @Param("biografiId") Long biografiId);
}
