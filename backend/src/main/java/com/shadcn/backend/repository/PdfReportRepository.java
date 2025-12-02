package com.shadcn.backend.repository;

import com.shadcn.backend.entity.PdfReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PdfReportRepository extends JpaRepository<PdfReport, Long> {
    Page<PdfReport> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<PdfReport> findByStatus(String status);
    List<PdfReport> findByCreatedByIdOrderByCreatedAtDesc(Long userId);
    
    // Find reports with failed WA messages (for scheduler auto-retry)
    @Query("SELECT DISTINCT r FROM PdfReport r JOIN r.items i WHERE r.status = 'COMPLETED' AND i.waStatus = 'FAILED'")
    List<PdfReport> findReportsWithFailedWaMessages();
    
    // Find reports with pending WA items (status=DONE, waStatus=PENDING, not excluded)
    @Query("SELECT DISTINCT r FROM PdfReport r JOIN r.items i WHERE i.status = 'DONE' AND i.waStatus = 'PENDING' AND (i.excluded IS NULL OR i.excluded = false)")
    List<PdfReport> findReportsWithPendingWaItems();
}
