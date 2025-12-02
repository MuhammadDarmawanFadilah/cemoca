package com.shadcn.backend.repository;

import com.shadcn.backend.model.Usulan;
import com.shadcn.backend.dto.UsulanSummaryDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface UsulanRepository extends JpaRepository<Usulan, Long> {
    
    // Find active usulan that are not expired (less than 5 days from creation)
    @Query("SELECT u FROM Usulan u WHERE u.status = 'AKTIF' AND u.durasiUsulan >= :currentDate ORDER BY (u.jumlahUpvote - u.jumlahDownvote) DESC, u.createdAt DESC")
    Page<Usulan> findActiveUsulanOrderByScore(@Param("currentDate") LocalDate currentDate, Pageable pageable);
    
    // Find expired usulan (more than 5 days)
    @Query("SELECT u FROM Usulan u WHERE u.durasiUsulan < :currentDate AND u.status = 'AKTIF'")
    List<Usulan> findExpiredUsulan(@Param("currentDate") LocalDate currentDate);
    
    // Find usulan for pelaksanaan (expired but not yet processed)
    @Query("SELECT u FROM Usulan u WHERE u.status = 'EXPIRED' ORDER BY u.createdAt DESC")
    Page<Usulan> findUsulanForPelaksanaan(Pageable pageable);    // Search usulan by judul only
    @Query(value = "SELECT * FROM usulan u WHERE LOWER(u.judul) LIKE LOWER(CONCAT('%', :keyword, '%')) AND u.status = :status AND u.durasi_usulan >= :currentDate ORDER BY (u.jumlah_upvote - u.jumlah_downvote) DESC, u.created_at DESC", 
           countQuery = "SELECT COUNT(*) FROM usulan u WHERE LOWER(u.judul) LIKE LOWER(CONCAT('%', :keyword, '%')) AND u.status = :status AND u.durasi_usulan >= :currentDate",
           nativeQuery = true)
    Page<Usulan> searchActiveUsulan(@Param("keyword") String keyword, @Param("status") String status, @Param("currentDate") LocalDate currentDate, Pageable pageable);
      // Advanced search with multiple filters
    @Query(value = """
        SELECT * FROM usulan u WHERE 
        u.durasi_usulan >= :currentDate AND
        (COALESCE(:status, 'AKTIF') = 'all' OR u.status = COALESCE(:status, 'AKTIF')) AND
        (:search IS NULL OR :search = '' OR LOWER(u.judul) LIKE LOWER(CONCAT('%', :search, '%')) 
         OR LOWER(u.rencana_kegiatan) LIKE LOWER(CONCAT('%', :search, '%'))         OR LOWER(u.nama_pengusul) LIKE LOWER(CONCAT('%', :search, '%'))) AND        (:judul IS NULL OR :judul = '' OR LOWER(u.judul) LIKE LOWER(CONCAT('%', :judul, '%'))) AND
        (:namaPengusul IS NULL OR :namaPengusul = '' OR LOWER(u.nama_pengusul) LIKE LOWER(CONCAT('%', :namaPengusul, '%'))) AND
        (:tanggalMulaiFrom IS NULL OR u.tanggal_mulai >= :tanggalMulaiFrom) AND
        (:tanggalMulaiTo IS NULL OR u.tanggal_mulai <= :tanggalMulaiTo) AND
        (:tanggalSelesaiFrom IS NULL OR u.tanggal_selesai >= :tanggalSelesaiFrom) AND
        (:tanggalSelesaiTo IS NULL OR u.tanggal_selesai <= :tanggalSelesaiTo)
        ORDER BY
        CASE WHEN :sortBy = 'judul' AND :sortDirection = 'asc' THEN u.judul END ASC,
        CASE WHEN :sortBy = 'judul' AND :sortDirection = 'desc' THEN u.judul END DESC,
        CASE WHEN :sortBy = 'tanggalMulai' AND :sortDirection = 'asc' THEN u.tanggal_mulai END ASC,
        CASE WHEN :sortBy = 'tanggalMulai' AND :sortDirection = 'desc' THEN u.tanggal_mulai END DESC,
        CASE WHEN :sortBy = 'jumlahUpvote' AND :sortDirection = 'asc' THEN u.jumlah_upvote END ASC,
        CASE WHEN :sortBy = 'jumlahUpvote' AND :sortDirection = 'desc' THEN u.jumlah_upvote END DESC,
        CASE WHEN :sortBy = 'durasiUsulan' AND :sortDirection = 'asc' THEN u.durasi_usulan END ASC,
        CASE WHEN :sortBy = 'durasiUsulan' AND :sortDirection = 'desc' THEN u.durasi_usulan END DESC,
        CASE WHEN :sortBy = 'createdAt' AND :sortDirection = 'asc' THEN u.created_at END ASC,
        CASE WHEN :sortBy = 'createdAt' AND :sortDirection = 'desc' THEN u.created_at END DESC,
        u.created_at DESC
        """,
        countQuery = """
        SELECT COUNT(*) FROM usulan u WHERE 
        u.durasi_usulan >= :currentDate AND
        (COALESCE(:status, 'AKTIF') = 'all' OR u.status = COALESCE(:status, 'AKTIF')) AND
        (:search IS NULL OR :search = '' OR LOWER(u.judul) LIKE LOWER(CONCAT('%', :search, '%')) 
         OR LOWER(u.rencana_kegiatan) LIKE LOWER(CONCAT('%', :search, '%'))         OR LOWER(u.nama_pengusul) LIKE LOWER(CONCAT('%', :search, '%'))) AND        (:judul IS NULL OR :judul = '' OR LOWER(u.judul) LIKE LOWER(CONCAT('%', :judul, '%'))) AND
        (:namaPengusul IS NULL OR :namaPengusul = '' OR LOWER(u.nama_pengusul) LIKE LOWER(CONCAT('%', :namaPengusul, '%'))) AND
        (:tanggalMulaiFrom IS NULL OR u.tanggal_mulai >= :tanggalMulaiFrom) AND
        (:tanggalMulaiTo IS NULL OR u.tanggal_mulai <= :tanggalMulaiTo) AND
        (:tanggalSelesaiFrom IS NULL OR u.tanggal_selesai >= :tanggalSelesaiFrom) AND
        (:tanggalSelesaiTo IS NULL OR u.tanggal_selesai <= :tanggalSelesaiTo)
        """,
        nativeQuery = true)
    Page<Usulan> searchUsulanWithFilters(
        @Param("search") String search,
        @Param("judul") String judul,
        @Param("namaPengusul") String namaPengusul,
        @Param("status") String status,
        @Param("tanggalMulaiFrom") LocalDate tanggalMulaiFrom,
        @Param("tanggalMulaiTo") LocalDate tanggalMulaiTo,
        @Param("tanggalSelesaiFrom") LocalDate tanggalSelesaiFrom,
        @Param("tanggalSelesaiTo") LocalDate tanggalSelesaiTo,
        @Param("currentDate") LocalDate currentDate,
        @Param("sortBy") String sortBy,
        @Param("sortDirection") String sortDirection,
        Pageable pageable
    );    // Find by status
    Page<Usulan> findByStatusOrderByCreatedAtDesc(Usulan.StatusUsulan status, Pageable pageable);
    
    // Find usulan with pelaksanaan (untuk menu pelaksanaan)
    @Query("SELECT u FROM Usulan u WHERE u.status IN ('DALAM_PELAKSANAAN', 'SELESAI') ORDER BY u.updatedAt DESC")
    Page<Usulan> findUsulanWithPelaksanaan(Pageable pageable);
      // Find usulan by id with all relationships loaded to avoid N+1 problem
    @Query("SELECT u FROM Usulan u " +
           "LEFT JOIN FETCH u.komentar " +
           "WHERE u.id = :id")
    Usulan findUsulanWithKomentar(@Param("id") Long id);
    
    @Query("SELECT u FROM Usulan u " +
           "LEFT JOIN FETCH u.votes " +
           "WHERE u.id = :id")
    Usulan findUsulanWithVotes(@Param("id") Long id);
    
    // Dashboard methods
    @Query("SELECT u FROM Usulan u WHERE u.status = 'AKTIF' ORDER BY (SELECT COUNT(v) FROM VoteUsulan v WHERE v.usulan = u) DESC, u.createdAt DESC")
    List<Usulan> findPopularActiveProposals();
    
    List<Usulan> findTop5ByOrderByCreatedAtDesc();
    
    Long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
}
