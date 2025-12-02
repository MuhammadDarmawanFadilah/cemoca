package com.shadcn.backend.repository;

import com.shadcn.backend.model.MediaPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MediaPostRepository extends JpaRepository<MediaPost, Long> {
    
    // Find media for a post ordered by mediaOrder
    @Query("SELECT m FROM MediaPost m WHERE m.postId = :postId ORDER BY m.mediaOrder ASC, m.createdAt ASC")
    List<MediaPost> findByPostIdOrderByOrder(@Param("postId") Long postId);
    
    // Find media by type
    @Query("SELECT m FROM MediaPost m WHERE m.mediaType = :mediaType ORDER BY m.createdAt DESC")
    List<MediaPost> findByMediaType(@Param("mediaType") String mediaType);
    
    // Find images for a post
    @Query("SELECT m FROM MediaPost m WHERE m.postId = :postId AND m.mediaType = 'IMAGE' ORDER BY m.mediaOrder ASC")
    List<MediaPost> findImagesByPostId(@Param("postId") Long postId);
    
    // Find videos for a post
    @Query("SELECT m FROM MediaPost m WHERE m.postId = :postId AND m.mediaType = 'VIDEO' ORDER BY m.mediaOrder ASC")
    List<MediaPost> findVideosByPostId(@Param("postId") Long postId);
    
    // Count media for a post
    @Query("SELECT COUNT(m) FROM MediaPost m WHERE m.postId = :postId")
    Long countByPostId(@Param("postId") Long postId);
    
    // Delete all media for a post
    void deleteByPostId(@Param("postId") Long postId);
    
    // Find recent media uploads
    @Query("SELECT m FROM MediaPost m ORDER BY m.createdAt DESC")
    List<MediaPost> findRecentMedia(org.springframework.data.domain.Pageable pageable);
}
