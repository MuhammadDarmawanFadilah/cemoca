package com.shadcn.backend.repository;

import com.shadcn.backend.model.BiografiView;
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
public interface BiografiViewRepository extends JpaRepository<BiografiView, Long> {
    
    /**
     * Get all views for a specific biografi
     */
    Page<BiografiView> findByBiografiIdOrderByViewedAtDesc(Long biografiId, Pageable pageable);
    
    /**
     * Count total views for a biografi
     */
    long countByBiografiId(Long biografiId);
    
    /**
     * Count unique viewers for a biografi
     */
    @Query("SELECT COUNT(DISTINCT CASE WHEN bv.viewerUserId IS NOT NULL THEN bv.viewerUserId ELSE bv.viewerIpAddress END) FROM BiografiView bv WHERE bv.biografiId = :biografiId")
    long countUniqueViewersByBiografiId(@Param("biografiId") Long biografiId);
    
    /**
     * Get recent views for a biografi (last 24 hours)
     */
    @Query("SELECT bv FROM BiografiView bv WHERE bv.biografiId = :biografiId AND bv.viewedAt >= :since ORDER BY bv.viewedAt DESC")
    List<BiografiView> findRecentViewsByBiografiId(@Param("biografiId") Long biografiId, @Param("since") LocalDateTime since);
    
    /**
     * Check if user has already viewed this biografi in current session
     */
    Optional<BiografiView> findByBiografiIdAndSessionId(Long biografiId, String sessionId);
    
    /**
     * Get views by authenticated user
     */
    List<BiografiView> findByViewerUserIdOrderByViewedAtDesc(Long viewerUserId);
    
    /**
     * Get authenticated vs anonymous view stats
     */
    @Query("SELECT bv.isAuthenticated, COUNT(bv) FROM BiografiView bv WHERE bv.biografiId = :biografiId GROUP BY bv.isAuthenticated")
    List<Object[]> getViewStatsByAuthentication(@Param("biografiId") Long biografiId);
    
    /**
     * Get top viewed biografi
     */
    @Query("SELECT bv.biografiId, COUNT(bv) as viewCount FROM BiografiView bv GROUP BY bv.biografiId ORDER BY viewCount DESC")
    List<Object[]> getTopViewedBiografi(Pageable pageable);
    
    /**
     * Get view history for admin dashboard
     */
    @Query("SELECT bv FROM BiografiView bv WHERE bv.viewedAt >= :since ORDER BY bv.viewedAt DESC")
    Page<BiografiView> findRecentViews(@Param("since") LocalDateTime since, Pageable pageable);
}
