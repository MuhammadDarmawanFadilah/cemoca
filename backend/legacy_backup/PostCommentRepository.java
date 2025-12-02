package com.shadcn.backend.repository;

import com.shadcn.backend.model.PostComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostCommentRepository extends JpaRepository<PostComment, Long> {
    
    // Find active comments for a post (top level only)
    @Query("SELECT c FROM PostComment c WHERE c.postId = :postId AND c.parentCommentId IS NULL AND c.status = 'AKTIF' ORDER BY c.createdAt ASC")
    Page<PostComment> findTopLevelCommentsByPostId(@Param("postId") Long postId, Pageable pageable);
    
    // Find replies to a comment
    @Query("SELECT c FROM PostComment c WHERE c.parentCommentId = :parentCommentId AND c.status = 'AKTIF' ORDER BY c.createdAt ASC")
    List<PostComment> findRepliesByParentCommentId(@Param("parentCommentId") Long parentCommentId);
    
    // Find active comment by ID
    @Query("SELECT c FROM PostComment c WHERE c.commentId = :commentId AND c.status = 'AKTIF'")
    Optional<PostComment> findActiveById(@Param("commentId") Long commentId);
    
    // Count comments for a post (including replies)
    @Query("SELECT COUNT(c) FROM PostComment c WHERE c.postId = :postId AND c.status = 'AKTIF'")
    Long countByPostIdAndActive(@Param("postId") Long postId);
    
    // Count top-level comments for a post
    @Query("SELECT COUNT(c) FROM PostComment c WHERE c.postId = :postId AND c.parentCommentId IS NULL AND c.status = 'AKTIF'")
    Long countTopLevelCommentsByPostId(@Param("postId") Long postId);
    
    // Count replies for a comment
    @Query("SELECT COUNT(c) FROM PostComment c WHERE c.parentCommentId = :parentCommentId AND c.status = 'AKTIF'")
    Long countRepliesByParentCommentId(@Param("parentCommentId") Long parentCommentId);
    
    // Find recent comments for a post (for preview)
    @Query("SELECT c FROM PostComment c WHERE c.postId = :postId AND c.status = 'AKTIF' ORDER BY c.createdAt DESC")
    List<PostComment> findRecentCommentsByPostId(@Param("postId") Long postId, Pageable pageable);
    
    // Find comments by user
    @Query("SELECT c FROM PostComment c WHERE c.biografiId = :biografiId AND c.status = 'AKTIF' ORDER BY c.createdAt DESC")
    Page<PostComment> findByBiografiIdAndActive(@Param("biografiId") Long biografiId, Pageable pageable);
    
    // Search comments by content
    @Query("SELECT c FROM PostComment c WHERE c.status = 'AKTIF' " +
           "AND (LOWER(c.konten) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(c.authorName) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY c.createdAt DESC")
    Page<PostComment> searchComments(@Param("keyword") String keyword, Pageable pageable);
    
    // Find all comments in a thread (post + all comments and replies)
    @Query("SELECT c FROM PostComment c WHERE c.postId = :postId AND c.status = 'AKTIF' ORDER BY c.createdAt ASC")
    List<PostComment> findAllCommentsByPostId(@Param("postId") Long postId);
}
