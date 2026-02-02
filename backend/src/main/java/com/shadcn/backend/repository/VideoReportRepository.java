package com.shadcn.backend.repository;

import com.shadcn.backend.entity.VideoReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VideoReportRepository extends JpaRepository<VideoReport, Long> {
    Page<VideoReport> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<VideoReport> findByStatus(String status);
    List<VideoReport> findByCreatedByIdOrderByCreatedAtDesc(Long userId);
    
    // Find reports with filters
    @Query("SELECT r FROM VideoReport r WHERE " +
           "(:reportType IS NULL OR :reportType = '' OR r.reportType = :reportType) AND " +
           "(:dateFrom IS NULL OR r.createdAt >= :dateFrom) AND " +
           "(:dateTo IS NULL OR r.createdAt <= :dateTo) AND " +
           "(:status IS NULL OR :status = '' OR r.status = :status) " +
           "ORDER BY r.createdAt DESC")
    Page<VideoReport> findByFilters(
        @Param("reportType") String reportType,
        @Param("dateFrom") LocalDateTime dateFrom,
        @Param("dateTo") LocalDateTime dateTo,
        @Param("status") String status,
        Pageable pageable
    );
    
    // Find reports with failed WA messages (for scheduler auto-retry)
    @Query("SELECT DISTINCT r FROM VideoReport r JOIN r.items i WHERE r.status = 'COMPLETED' AND i.waStatus = 'FAILED'")
    List<VideoReport> findReportsWithFailedWaMessages();
    
    // Find reports with pending WA items (status=DONE, waStatus=PENDING, not excluded)
    @Query("SELECT DISTINCT r FROM VideoReport r JOIN r.items i WHERE i.status = 'DONE' AND i.videoUrl IS NOT NULL AND i.videoUrl <> '' AND (i.waStatus = 'PENDING' OR i.waStatus IS NULL) AND (i.excluded IS NULL OR i.excluded = false)")
    List<VideoReport> findReportsWithPendingWaItems();

    // Find reports with queued/sent WA items that can be synced via messageId
    @Query("SELECT DISTINCT r FROM VideoReport r JOIN r.items i WHERE r.status = 'COMPLETED' AND i.waMessageId IS NOT NULL AND i.waMessageId <> '' AND (i.waStatus = 'QUEUED' OR i.waStatus = 'SENT')")
    List<VideoReport> findReportsWithWaItemsToSync();
}
