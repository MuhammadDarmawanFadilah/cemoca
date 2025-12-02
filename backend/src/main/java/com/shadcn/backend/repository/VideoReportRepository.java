package com.shadcn.backend.repository;

import com.shadcn.backend.entity.VideoReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VideoReportRepository extends JpaRepository<VideoReport, Long> {
    Page<VideoReport> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<VideoReport> findByStatus(String status);
    List<VideoReport> findByCreatedByIdOrderByCreatedAtDesc(Long userId);
    
    // Find reports with failed WA messages (for scheduler auto-retry)
    @Query("SELECT DISTINCT r FROM VideoReport r JOIN r.items i WHERE r.status = 'COMPLETED' AND i.waStatus = 'FAILED'")
    List<VideoReport> findReportsWithFailedWaMessages();
    
    // Find reports with pending WA items (status=DONE, waStatus=PENDING, not excluded)
    @Query("SELECT DISTINCT r FROM VideoReport r JOIN r.items i WHERE i.status = 'DONE' AND i.waStatus = 'PENDING' AND (i.excluded IS NULL OR i.excluded = false)")
    List<VideoReport> findReportsWithPendingWaItems();
}
