package com.shadcn.backend.repository;

import com.shadcn.backend.entity.PdfReportItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PdfReportItemRepository extends JpaRepository<PdfReportItem, Long> {
    List<PdfReportItem> findByPdfReportIdOrderByRowNumberAsc(Long pdfReportId);
    List<PdfReportItem> findByPdfReportIdAndStatus(Long pdfReportId, String status);
    List<PdfReportItem> findByStatus(String status);
    int countByPdfReportIdAndStatus(Long pdfReportId, String status);
    
    // Find single item by ID and report ID
    PdfReportItem findByIdAndPdfReportId(Long id, Long pdfReportId);
    
    // Paginated queries for large datasets
    Page<PdfReportItem> findByPdfReportIdOrderByRowNumberAsc(Long pdfReportId, Pageable pageable);
    Page<PdfReportItem> findByPdfReportIdAndStatusOrderByRowNumberAsc(Long pdfReportId, String status, Pageable pageable);
    
    // Search with pagination
    @Query("SELECT i FROM PdfReportItem i WHERE i.pdfReport.id = :reportId AND " +
           "(LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.phone) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY i.rowNumber ASC")
    Page<PdfReportItem> searchByReportId(@Param("reportId") Long reportId, @Param("search") String search, Pageable pageable);
    
    // Search with status filter and pagination
    @Query("SELECT i FROM PdfReportItem i WHERE i.pdfReport.id = :reportId AND i.status = :status AND " +
           "(LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.phone) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY i.rowNumber ASC")
    Page<PdfReportItem> searchByReportIdAndStatus(@Param("reportId") Long reportId, @Param("status") String status, @Param("search") String search, Pageable pageable);
    
    // WhatsApp status queries
    int countByPdfReportIdAndWaStatus(Long pdfReportId, String waStatus);
    List<PdfReportItem> findByPdfReportIdAndWaStatus(Long pdfReportId, String waStatus);
    
    // Paginated WA status filter
    Page<PdfReportItem> findByPdfReportIdAndWaStatusOrderByRowNumberAsc(Long pdfReportId, String waStatus, Pageable pageable);
    
    // Search with WA status filter and pagination
    @Query("SELECT i FROM PdfReportItem i WHERE i.pdfReport.id = :reportId AND i.waStatus = :waStatus AND " +
           "(LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.phone) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY i.rowNumber ASC")
    Page<PdfReportItem> searchByReportIdAndWaStatus(@Param("reportId") Long reportId, @Param("waStatus") String waStatus, @Param("search") String search, Pageable pageable);
    
    // Get items ready for WA blast (PDF done, wa pending only - not processing, not excluded)
    @Query("SELECT i FROM PdfReportItem i WHERE i.pdfReport.id = :reportId AND i.status = 'DONE' AND i.waStatus = 'PENDING' AND (i.excluded = false OR i.excluded IS NULL) ORDER BY i.rowNumber ASC")
    List<PdfReportItem> findReadyForWaBlast(@Param("reportId") Long reportId);
    
    // Count items ready for WA blast
    @Query("SELECT COUNT(i) FROM PdfReportItem i WHERE i.pdfReport.id = :reportId AND i.status = 'DONE' AND i.waStatus = 'PENDING' AND (i.excluded = false OR i.excluded IS NULL)")
    int countReadyForWaBlast(@Param("reportId") Long reportId);
    
    // Get items with completed PDFs (for step 2)
    @Query("SELECT i FROM PdfReportItem i WHERE i.pdfReport.id = :reportId AND (i.excluded = false OR i.excluded IS NULL) ORDER BY i.rowNumber ASC")
    List<PdfReportItem> findNonExcludedByReportId(@Param("reportId") Long reportId);
    
    // Count non-excluded items
    @Query("SELECT COUNT(i) FROM PdfReportItem i WHERE i.pdfReport.id = :reportId AND (i.excluded = false OR i.excluded IS NULL)")
    int countNonExcludedByReportId(@Param("reportId") Long reportId);
    
    // Count non-excluded items with specific status
    @Query("SELECT COUNT(i) FROM PdfReportItem i WHERE i.pdfReport.id = :reportId AND i.status = :status AND (i.excluded = false OR i.excluded IS NULL)")
    int countNonExcludedByReportIdAndStatus(@Param("reportId") Long reportId, @Param("status") String status);
    
    // Find all items ready for WA blast across all reports (for scheduler) - only PENDING, not PROCESSING
    @Query("SELECT i FROM PdfReportItem i WHERE i.status = 'DONE' AND i.waStatus = 'PENDING' AND (i.excluded = false OR i.excluded IS NULL) ORDER BY i.pdfReport.id ASC, i.rowNumber ASC")
    List<PdfReportItem> findItemsReadyForWaBlast();
    
    // Find items stuck in PROCESSING state for too long (for auto-recovery scheduler)
    @Query("SELECT i FROM PdfReportItem i WHERE i.status = 'PROCESSING' AND i.updatedAt < :threshold")
    List<PdfReportItem> findStuckProcessingItems(@Param("threshold") java.time.LocalDateTime threshold);
    
    // Find WA items stuck in PROCESSING state for too long (for auto-recovery scheduler)
    @Query("SELECT i FROM PdfReportItem i WHERE i.waStatus = 'PROCESSING' AND i.updatedAt < :threshold")
    List<PdfReportItem> findStuckWaProcessingItems(@Param("threshold") java.time.LocalDateTime threshold);
}
