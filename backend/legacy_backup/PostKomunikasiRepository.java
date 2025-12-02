package com.shadcn.backend.repository;

import com.shadcn.backend.model.PostKomunikasi;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PostKomunikasiRepository extends JpaRepository<PostKomunikasi, Long> {
      // Find active posts ordered by creation date (feed)
    @Query("SELECT p FROM PostKomunikasi p WHERE p.status = :status ORDER BY p.createdAt DESC")
    Page<PostKomunikasi> findActivePosts(@Param("status") PostKomunikasi.StatusPost status, Pageable pageable);
      // Find posts by user
    @Query("SELECT p FROM PostKomunikasi p WHERE p.biografiId = :biografiId AND p.status = :status ORDER BY p.createdAt DESC")
    Page<PostKomunikasi> findByBiografiIdAndActive(@Param("biografiId") Long biografiId, @Param("status") PostKomunikasi.StatusPost status, Pageable pageable);
      // Find active post by ID
    @Query("SELECT p FROM PostKomunikasi p WHERE p.postId = :postId AND p.status = :status")
    Optional<PostKomunikasi> findActiveById(@Param("postId") Long postId, @Param("status") PostKomunikasi.StatusPost status);
    
    // Find popular posts (by reaction count)
    @Query("SELECT p FROM PostKomunikasi p WHERE p.status = 'AKTIF' " +
           "ORDER BY (p.likeCount + p.commentCount) DESC, p.createdAt DESC")
    Page<PostKomunikasi> findPopularPosts(Pageable pageable);
    
    // Find recent posts (last 24 hours)
    @Query("SELECT p FROM PostKomunikasi p WHERE p.status = 'AKTIF' " +
           "AND p.createdAt >= :since ORDER BY p.createdAt DESC")
    Page<PostKomunikasi> findRecentPosts(@Param("since") LocalDateTime since, Pageable pageable);
    
    // Search posts by content
    @Query("SELECT p FROM PostKomunikasi p WHERE p.status = 'AKTIF' " +
           "AND (LOWER(p.konten) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.authorName) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY p.createdAt DESC")
    Page<PostKomunikasi> searchPosts(@Param("keyword") String keyword, Pageable pageable);
    
    // Count posts by user
    @Query("SELECT COUNT(p) FROM PostKomunikasi p WHERE p.biografiId = :biografiId AND p.status = 'AKTIF'")
    Long countByBiografiIdAndActive(@Param("biografiId") Long biografiId);
    
    // Find posts with media
    @Query("SELECT DISTINCT p FROM PostKomunikasi p JOIN p.media m WHERE p.status = 'AKTIF' ORDER BY p.createdAt DESC")
    Page<PostKomunikasi> findPostsWithMedia(Pageable pageable);
    
    // Find trending posts (high engagement in last week)
    @Query("SELECT p FROM PostKomunikasi p WHERE p.status = 'AKTIF' " +
           "AND p.createdAt >= :since " +
           "AND (p.likeCount + p.commentCount) > 0 " +
           "ORDER BY (p.likeCount + p.commentCount) DESC, p.createdAt DESC")
    Page<PostKomunikasi> findTrendingPosts(@Param("since") LocalDateTime since, Pageable pageable);
    
    // Get posts by alumni year
    @Query("SELECT p FROM PostKomunikasi p WHERE p.status = 'AKTIF' " +
           "AND p.authorAlumniTahun = :alumniTahun ORDER BY p.createdAt DESC")
    Page<PostKomunikasi> findByAlumniTahun(@Param("alumniTahun") String alumniTahun, Pageable pageable);
    
    // Get posts by jurusan
    @Query("SELECT p FROM PostKomunikasi p WHERE p.status = 'AKTIF' " +
           "AND p.authorJurusan = :jurusan ORDER BY p.createdAt DESC")
    Page<PostKomunikasi> findByJurusan(@Param("jurusan") String jurusan, Pageable pageable);
    
    // ========== STATISTICS QUERIES ========= =
    
    // Count distinct authors (active members)
    @Query("SELECT COUNT(DISTINCT p.biografiId) FROM PostKomunikasi p WHERE p.status = 'AKTIF'")
    Long countDistinctAuthors();
    
    // Count posts between dates
    @Query("SELECT COUNT(p) FROM PostKomunikasi p WHERE p.status = 'AKTIF' " +
           "AND p.createdAt >= :startDate AND p.createdAt < :endDate")
    Long countPostsBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);    // Find top recent posts for trending analysis
    List<PostKomunikasi> findTop50ByStatusOrderByCreatedAtDesc(PostKomunikasi.StatusPost status);
}
