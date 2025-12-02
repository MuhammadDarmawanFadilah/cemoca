package com.shadcn.backend.repository;

import com.shadcn.backend.model.CommentReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentReactionRepository extends JpaRepository<CommentReaction, Long> {
    
    // Find user's reaction to a comment
    @Query("SELECT r FROM CommentReaction r WHERE r.commentId = :commentId AND r.biografiId = :biografiId")
    Optional<CommentReaction> findByCommentIdAndBiografiId(@Param("commentId") Long commentId, @Param("biografiId") Long biografiId);
    
    // Find all reactions for a comment
    @Query("SELECT r FROM CommentReaction r WHERE r.commentId = :commentId ORDER BY r.createdAt DESC")
    List<CommentReaction> findByCommentId(@Param("commentId") Long commentId);
    
    // Count reactions by type for a comment
    @Query("SELECT r.reactionType, COUNT(r) FROM CommentReaction r WHERE r.commentId = :commentId GROUP BY r.reactionType")
    List<Object[]> countReactionsByType(@Param("commentId") Long commentId);
    
    // Count likes for a comment
    @Query("SELECT COUNT(r) FROM CommentReaction r WHERE r.commentId = :commentId AND r.reactionType = 'LIKE'")
    Long countLikesByCommentId(@Param("commentId") Long commentId);
    
    // Count dislikes for a comment
    @Query("SELECT COUNT(r) FROM CommentReaction r WHERE r.commentId = :commentId AND r.reactionType = 'DISLIKE'")
    Long countDislikesByCommentId(@Param("commentId") Long commentId);
    
    // Find users who liked a comment
    @Query("SELECT r FROM CommentReaction r WHERE r.commentId = :commentId AND r.reactionType = 'LIKE' ORDER BY r.createdAt DESC")
    List<CommentReaction> findLikesByCommentId(@Param("commentId") Long commentId);
    
    // Find all reactions by user
    @Query("SELECT r FROM CommentReaction r WHERE r.biografiId = :biografiId ORDER BY r.createdAt DESC")
    List<CommentReaction> findByBiografiId(@Param("biografiId") Long biografiId);
    
    // Delete reaction
    void deleteByCommentIdAndBiografiId(@Param("commentId") Long commentId, @Param("biografiId") Long biografiId);
}
