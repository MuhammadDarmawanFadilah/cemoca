package com.shadcn.backend.repository;

import com.shadcn.backend.entity.VideoReportItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface VideoReportItemRepository extends JpaRepository<VideoReportItem, Long> {
    List<VideoReportItem> findByVideoReportIdOrderByRowNumberAsc(Long videoReportId);
    List<VideoReportItem> findByVideoReportIdAndStatus(Long videoReportId, String status);
    List<VideoReportItem> findByStatus(String status);
    int countByVideoReportIdAndStatus(Long videoReportId, String status);
    
    // Find single item by ID and report ID
    VideoReportItem findByIdAndVideoReportId(Long id, Long videoReportId);
    
    // Paginated queries for large datasets
    Page<VideoReportItem> findByVideoReportIdOrderByRowNumberAsc(Long videoReportId, Pageable pageable);
    Page<VideoReportItem> findByVideoReportIdAndStatusOrderByRowNumberAsc(Long videoReportId, String status, Pageable pageable);
    
    // Search with pagination
    @Query("SELECT i FROM VideoReportItem i WHERE i.videoReport.id = :reportId AND " +
           "(LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.phone) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY i.rowNumber ASC")
    Page<VideoReportItem> searchByReportId(@Param("reportId") Long reportId, @Param("search") String search, Pageable pageable);
    
    // Search with status filter and pagination
    @Query("SELECT i FROM VideoReportItem i WHERE i.videoReport.id = :reportId AND i.status = :status AND " +
           "(LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.phone) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY i.rowNumber ASC")
    Page<VideoReportItem> searchByReportIdAndStatus(@Param("reportId") Long reportId, @Param("status") String status, @Param("search") String search, Pageable pageable);
    
    // WhatsApp status queries
    int countByVideoReportIdAndWaStatus(Long videoReportId, String waStatus);
    List<VideoReportItem> findByVideoReportIdAndWaStatus(Long videoReportId, String waStatus);
    
    // Paginated WA status filter
    Page<VideoReportItem> findByVideoReportIdAndWaStatusOrderByRowNumberAsc(Long videoReportId, String waStatus, Pageable pageable);

    // Paginated WA status IN filter
    @Query("SELECT i FROM VideoReportItem i WHERE i.videoReport.id = :reportId AND i.waStatus IN :waStatuses ORDER BY i.rowNumber ASC")
    Page<VideoReportItem> findByReportIdAndWaStatusInOrderByRowNumberAsc(
           @Param("reportId") Long reportId,
           @Param("waStatuses") Collection<String> waStatuses,
           Pageable pageable);

    // Paginated WA status IN filter including NULL
    @Query("SELECT i FROM VideoReportItem i WHERE i.videoReport.id = :reportId AND (i.waStatus IS NULL OR i.waStatus IN :waStatuses) ORDER BY i.rowNumber ASC")
    Page<VideoReportItem> findByReportIdAndWaStatusInOrNullOrderByRowNumberAsc(
           @Param("reportId") Long reportId,
           @Param("waStatuses") Collection<String> waStatuses,
           Pageable pageable);
    
    // Search with WA status filter and pagination
    @Query("SELECT i FROM VideoReportItem i WHERE i.videoReport.id = :reportId AND i.waStatus = :waStatus AND " +
           "(LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.phone) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY i.rowNumber ASC")
    Page<VideoReportItem> searchByReportIdAndWaStatus(@Param("reportId") Long reportId, @Param("waStatus") String waStatus, @Param("search") String search, Pageable pageable);

    // Search with WA status IN filter and pagination
    @Query("SELECT i FROM VideoReportItem i WHERE i.videoReport.id = :reportId AND i.waStatus IN :waStatuses AND " +
           "(LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.phone) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY i.rowNumber ASC")
    Page<VideoReportItem> searchByReportIdAndWaStatusIn(
           @Param("reportId") Long reportId,
           @Param("waStatuses") Collection<String> waStatuses,
           @Param("search") String search,
           Pageable pageable);

    // Search with WA status IN filter including NULL and pagination
    @Query("SELECT i FROM VideoReportItem i WHERE i.videoReport.id = :reportId AND (i.waStatus IS NULL OR i.waStatus IN :waStatuses) AND " +
           "(LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.phone) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY i.rowNumber ASC")
    Page<VideoReportItem> searchByReportIdAndWaStatusInOrNull(
           @Param("reportId") Long reportId,
           @Param("waStatuses") Collection<String> waStatuses,
           @Param("search") String search,
           Pageable pageable);
    
    // Get items ready for WA blast (video done, wa pending only - not processing, not excluded)
       @Query("SELECT i FROM VideoReportItem i WHERE i.videoReport.id = :reportId AND i.status = 'DONE' AND (i.waStatus = 'PENDING' OR i.waStatus IS NULL) AND (i.excluded = false OR i.excluded IS NULL) ORDER BY i.rowNumber ASC")
    List<VideoReportItem> findReadyForWaBlast(@Param("reportId") Long reportId);
    
    // Count items ready for WA blast
       @Query("SELECT COUNT(i) FROM VideoReportItem i WHERE i.videoReport.id = :reportId AND i.status = 'DONE' AND (i.waStatus = 'PENDING' OR i.waStatus IS NULL) AND (i.excluded = false OR i.excluded IS NULL)")
    int countReadyForWaBlast(@Param("reportId") Long reportId);
    
    // Get items with completed videos (for step 2)
    @Query("SELECT i FROM VideoReportItem i WHERE i.videoReport.id = :reportId AND (i.excluded = false OR i.excluded IS NULL) ORDER BY i.rowNumber ASC")
    List<VideoReportItem> findNonExcludedByReportId(@Param("reportId") Long reportId);
    
    // Count non-excluded items
    @Query("SELECT COUNT(i) FROM VideoReportItem i WHERE i.videoReport.id = :reportId AND (i.excluded = false OR i.excluded IS NULL)")
    int countNonExcludedByReportId(@Param("reportId") Long reportId);
    
    // Count non-excluded items with specific status
    @Query("SELECT COUNT(i) FROM VideoReportItem i WHERE i.videoReport.id = :reportId AND i.status = :status AND (i.excluded = false OR i.excluded IS NULL)")
    int countNonExcludedByReportIdAndStatus(@Param("reportId") Long reportId, @Param("status") String status);
    
    // Find all items ready for WA blast across all reports (for scheduler) - only PENDING, not PROCESSING
       @Query("SELECT i FROM VideoReportItem i WHERE i.status = 'DONE' AND (i.waStatus = 'PENDING' OR i.waStatus IS NULL) AND (i.excluded = false OR i.excluded IS NULL) ORDER BY i.videoReport.id ASC, i.rowNumber ASC")
    List<VideoReportItem> findItemsReadyForWaBlast();
    
    // Find items stuck in PROCESSING state for too long (for auto-recovery scheduler)
    @Query("SELECT i FROM VideoReportItem i WHERE i.status = 'PROCESSING' AND i.updatedAt < :threshold")
    List<VideoReportItem> findStuckProcessingItems(@Param("threshold") java.time.LocalDateTime threshold);
    
    // Find WA items stuck in PROCESSING state for too long (for auto-recovery scheduler)
    @Query("SELECT i FROM VideoReportItem i WHERE i.waStatus = 'PROCESSING' AND i.updatedAt < :threshold")
    List<VideoReportItem> findStuckWaProcessingItems(@Param("threshold") java.time.LocalDateTime threshold);

       // Find WA items stuck in PENDING/QUEUED state for too long (for auto-recovery scheduler)
       @Query("SELECT i FROM VideoReportItem i WHERE i.status = 'DONE' AND (i.waStatus = 'PENDING' OR i.waStatus = 'QUEUED' OR i.waStatus IS NULL) AND i.updatedAt < :threshold AND (i.excluded = false OR i.excluded IS NULL)")
       List<VideoReportItem> findStuckWaPendingItems(@Param("threshold") java.time.LocalDateTime threshold);
}
