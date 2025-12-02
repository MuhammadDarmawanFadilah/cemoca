package com.shadcn.backend.repository;

import com.shadcn.backend.model.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    
    // Find active documents
    List<Document> findByIsActiveTrueOrderByCreatedAtDesc();
    
    // Find documents by title containing keyword (case insensitive)
    @Query("SELECT d FROM Document d WHERE d.isActive = true AND LOWER(d.title) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Document> findByTitleContainingIgnoreCase(@Param("keyword") String keyword);
    
    // Find documents by author containing keyword (case insensitive)
    @Query("SELECT d FROM Document d WHERE d.isActive = true AND LOWER(d.author) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Document> findByAuthorContainingIgnoreCase(@Param("keyword") String keyword);
    
    // Find documents by file type
    List<Document> findByFileTypeAndIsActiveTrue(String fileType);
    
    // Search documents by title, author, or summary
    @Query("SELECT d FROM Document d WHERE d.isActive = true AND " +
           "(LOWER(d.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(d.author) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(d.summary) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Document> searchDocuments(@Param("keyword") String keyword);
    
    // Paginated search
    @Query("SELECT d FROM Document d WHERE d.isActive = true AND " +
           "(LOWER(d.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(d.author) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(d.summary) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Document> searchDocuments(@Param("keyword") String keyword, Pageable pageable);
      // Find all active documents with pagination
    Page<Document> findByIsActiveTrueOrderByCreatedAtDesc(Pageable pageable);
    
    // Find documents by file type with pagination
    Page<Document> findByIsActiveTrueAndFileTypeContainingIgnoreCase(String fileType, Pageable pageable);
    
    // Find documents by author with pagination  
    Page<Document> findByIsActiveTrueAndAuthorContainingIgnoreCase(String author, Pageable pageable);
    
    // Find documents by file type and author with pagination
    Page<Document> findByIsActiveTrueAndFileTypeContainingIgnoreCaseAndAuthorContainingIgnoreCase(
        String fileType, String author, Pageable pageable);
    
    // Find documents by title with pagination
    Page<Document> findByIsActiveTrueAndTitleContainingIgnoreCase(String title, Pageable pageable);
    
    // Find documents by file type and title with pagination
    Page<Document> findByIsActiveTrueAndFileTypeContainingIgnoreCaseAndTitleContainingIgnoreCase(
        String fileType, String title, Pageable pageable);
    
    // Find documents by author and title with pagination
    Page<Document> findByIsActiveTrueAndAuthorContainingIgnoreCaseAndTitleContainingIgnoreCase(
        String author, String title, Pageable pageable);
    
    // Find documents by file type, author, and title with pagination
    Page<Document> findByIsActiveTrueAndFileTypeContainingIgnoreCaseAndAuthorContainingIgnoreCaseAndTitleContainingIgnoreCase(
        String fileType, String author, String title, Pageable pageable);
    
    // Search documents with file type filter
    @Query("SELECT d FROM Document d WHERE d.isActive = true AND " +
           "LOWER(d.fileType) LIKE LOWER(CONCAT('%', :fileType, '%')) AND " +
           "(LOWER(d.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(d.author) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(d.summary) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Document> searchDocumentsWithFileType(@Param("keyword") String keyword, 
                                              @Param("fileType") String fileType, 
                                              Pageable pageable);      // Dashboard methods
    @Query("SELECT d FROM Document d WHERE d.createdAt >= :startOfMonth ORDER BY d.createdAt DESC")
    List<Document> findByCreatedAtAfter(@Param("startOfMonth") java.time.LocalDateTime startOfMonth);
    
    @Query("SELECT d FROM Document d WHERE d.createdAt >= :startOfMonth ORDER BY COALESCE(d.downloadCount, 0) DESC, d.createdAt DESC")
    List<Document> findTop3PopularThisMonth(@Param("startOfMonth") java.time.LocalDateTime startOfMonth);
    
    Long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
}
