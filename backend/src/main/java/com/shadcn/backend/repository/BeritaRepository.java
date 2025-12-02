package com.shadcn.backend.repository;

import com.shadcn.backend.model.Berita;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BeritaRepository extends JpaRepository<Berita, Long> {
    
    // Find by status
    Page<Berita> findByStatusOrderByCreatedAtDesc(Berita.StatusBerita status, Pageable pageable);
    
    // Find by kategori
    Page<Berita> findByKategoriAndStatusOrderByCreatedAtDesc(Berita.KategoriBerita kategori, Berita.StatusBerita status, Pageable pageable);    // Search by judul only (case insensitive) 
    @Query(value = "SELECT * FROM berita b WHERE LOWER(b.judul) LIKE LOWER(CONCAT('%', :judulKeyword, '%')) AND b.status = :status", 
           countQuery = "SELECT count(*) FROM berita b WHERE LOWER(b.judul) LIKE LOWER(CONCAT('%', :judulKeyword, '%')) AND b.status = :status",
           nativeQuery = true)
    Page<Berita> findByJudulContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(
        @Param("judulKeyword") String judulKeyword, @Param("status") String status, Pageable pageable);    // Search by judul or konten (case insensitive)
    @Query(value = "SELECT * FROM berita b WHERE (LOWER(b.judul) LIKE LOWER(CONCAT('%', :judulKeyword, '%')) OR LOWER(b.konten) LIKE LOWER(CONCAT('%', :kontenKeyword, '%'))) AND b.status = :status", 
           countQuery = "SELECT count(*) FROM berita b WHERE (LOWER(b.judul) LIKE LOWER(CONCAT('%', :judulKeyword, '%')) OR LOWER(b.konten) LIKE LOWER(CONCAT('%', :kontenKeyword, '%'))) AND b.status = :status",
           nativeQuery = true)
    Page<Berita> findByJudulContainingIgnoreCaseOrKontenContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(
        @Param("judulKeyword") String judulKeyword, @Param("kontenKeyword") String kontenKeyword, @Param("status") String status, Pageable pageable);
    
    // Search by judul and filter by kategori
    @Query(value = "SELECT * FROM berita b WHERE LOWER(b.judul) LIKE LOWER(CONCAT('%', :judulKeyword, '%')) AND b.status = :status AND b.kategori = :kategori ORDER BY b.created_at DESC", 
           countQuery = "SELECT count(*) FROM berita b WHERE LOWER(b.judul) LIKE LOWER(CONCAT('%', :judulKeyword, '%')) AND b.status = :status AND b.kategori = :kategori",
           nativeQuery = true)
    Page<Berita> findByJudulContainingIgnoreCaseAndStatusAndKategoriOrderByCreatedAtDesc(
        @Param("judulKeyword") String judulKeyword, @Param("status") String status, @Param("kategori") String kategori, Pageable pageable);    // Search by judul or konten and filter by kategori
    @Query(value = "SELECT * FROM berita b WHERE (LOWER(b.judul) LIKE LOWER(CONCAT('%', :judulKeyword, '%')) OR LOWER(b.konten) LIKE LOWER(CONCAT('%', :kontenKeyword, '%'))) AND b.status = :status AND b.kategori = :kategori", 
           countQuery = "SELECT count(*) FROM berita b WHERE (LOWER(b.judul) LIKE LOWER(CONCAT('%', :judulKeyword, '%')) OR LOWER(b.konten) LIKE LOWER(CONCAT('%', :kontenKeyword, '%'))) AND b.status = :status AND b.kategori = :kategori",
           nativeQuery = true)
    Page<Berita> findByJudulContainingIgnoreCaseOrKontenContainingIgnoreCaseAndStatusAndKategoriOrderByCreatedAtDesc(
        @Param("judulKeyword") String judulKeyword, @Param("kontenKeyword") String kontenKeyword, @Param("status") String status, @Param("kategori") String kategori, Pageable pageable);
    
    // Get popular berita (by views)
    Page<Berita> findByStatusOrderByJumlahViewDescCreatedAtDesc(Berita.StatusBerita status, Pageable pageable);
    
    // Get latest berita
    List<Berita> findTop5ByStatusOrderByCreatedAtDesc(Berita.StatusBerita status);
    
    // Increment view count
    @Modifying
    @Query("UPDATE Berita b SET b.jumlahView = b.jumlahView + 1 WHERE b.id = :id")
    void incrementViewCount(@Param("id") Long id);
    
    // Increment like count
    @Modifying
    @Query("UPDATE Berita b SET b.jumlahLike = b.jumlahLike + 1 WHERE b.id = :id")
    void incrementLikeCount(@Param("id") Long id);
    
    // Count by status
    long countByStatus(Berita.StatusBerita status);
    
    // Count by kategori and status
    long countByKategoriAndStatus(Berita.KategoriBerita kategori, Berita.StatusBerita status);
    
    // Optimized query to get berita summary without comments to avoid N+1 problem
    @Query("SELECT new com.shadcn.backend.dto.BeritaSummaryDto(" +
           "b.id, b.judul, b.ringkasan, b.penulis, b.penulisBiografiId, b.ringkasanWordCount, " +
           "b.gambarUrl, b.mediaLampiran, b.status, b.kategori, b.tags, " +
           "b.jumlahView, b.jumlahLike, b.createdAt, b.updatedAt) " +
           "FROM Berita b WHERE b.status = :status ORDER BY b.createdAt DESC")
    Page<com.shadcn.backend.dto.BeritaSummaryDto> findBeritaSummaryByStatus(@Param("status") Berita.StatusBerita status, Pageable pageable);
    
    @Query("SELECT new com.shadcn.backend.dto.BeritaSummaryDto(" +
           "b.id, b.judul, b.ringkasan, b.penulis, b.penulisBiografiId, b.ringkasanWordCount, " +
           "b.gambarUrl, b.mediaLampiran, b.status, b.kategori, b.tags, " +
           "b.jumlahView, b.jumlahLike, b.createdAt, b.updatedAt) " +
           "FROM Berita b WHERE b.kategori = :kategori AND b.status = :status ORDER BY b.createdAt DESC")
    Page<com.shadcn.backend.dto.BeritaSummaryDto> findBeritaSummaryByKategoriAndStatus(@Param("kategori") Berita.KategoriBerita kategori, @Param("status") Berita.StatusBerita status, Pageable pageable);
      @Query("SELECT new com.shadcn.backend.dto.BeritaSummaryDto(" +
           "b.id, b.judul, b.ringkasan, b.penulis, b.penulisBiografiId, b.ringkasanWordCount, " +
           "b.gambarUrl, b.mediaLampiran, b.status, b.kategori, b.tags, " +
           "b.jumlahView, b.jumlahLike, b.createdAt, b.updatedAt) " +
           "FROM Berita b WHERE (b.judul LIKE %:search% OR " +
           "b.konten LIKE %:search%) AND b.status = :status ORDER BY b.createdAt DESC")
    Page<com.shadcn.backend.dto.BeritaSummaryDto> findBeritaSummaryBySearch(@Param("search") String search, @Param("status") Berita.StatusBerita status, Pageable pageable);
    
    // Dashboard methods
    @Query("SELECT b FROM Berita b WHERE b.createdAt >= :startOfMonth ORDER BY b.createdAt DESC")
    List<Berita> findByCreatedAtAfter(@Param("startOfMonth") java.time.LocalDateTime startOfMonth);
      @Query("SELECT b FROM Berita b WHERE b.createdAt >= :startOfMonth ORDER BY COALESCE(b.jumlahView, 0) DESC, b.createdAt DESC")
    List<Berita> findTop3PopularThisMonth(@Param("startOfMonth") java.time.LocalDateTime startOfMonth);
    
    List<Berita> findTop5ByOrderByCreatedAtDesc();
    
    Long countByCreatedAtAfter(java.time.LocalDateTime date);
      Long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
    
    // Get berita detail without comments for optimization
    @Query("SELECT b FROM Berita b WHERE b.id = :id")
    Optional<Berita> findByIdWithoutComments(@Param("id") Long id);
    
    // Optimized query to get popular berita summary without comments to avoid N+1 problem
    @Query("SELECT new com.shadcn.backend.dto.BeritaSummaryDto(" +
           "b.id, b.judul, b.ringkasan, b.penulis, b.penulisBiografiId, b.ringkasanWordCount, " +
           "b.gambarUrl, b.mediaLampiran, b.status, b.kategori, b.tags, " +
           "b.jumlahView, b.jumlahLike, b.createdAt, b.updatedAt) " +
           "FROM Berita b WHERE b.status = :status ORDER BY b.jumlahView DESC, b.createdAt DESC")
    Page<com.shadcn.backend.dto.BeritaSummaryDto> findPopularBeritaSummaryByStatus(@Param("status") Berita.StatusBerita status, Pageable pageable);
}
