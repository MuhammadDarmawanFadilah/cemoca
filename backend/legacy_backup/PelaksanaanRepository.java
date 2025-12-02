package com.shadcn.backend.repository;

import com.shadcn.backend.model.Pelaksanaan;
import com.shadcn.backend.dto.PelaksanaanDetailDto;
import com.shadcn.backend.dto.PelaksanaanSummaryDto;
import com.shadcn.backend.dto.PelaksanaanSummaryDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface PelaksanaanRepository extends JpaRepository<Pelaksanaan, Long> {
    
    Optional<Pelaksanaan> findByUsulanId(Long usulanId);    // Optimized single pelaksanaan lookup with usulan fetch join to avoid N+1
    @Query("SELECT p FROM Pelaksanaan p " +
           "JOIN FETCH p.usulan " +
           "WHERE p.id = :id")
    Optional<Pelaksanaan> findByIdWithUsulan(@Param("id") Long id);
      // Efficient query for pelaksanaan detail - only select needed fields without comments
    @Query("SELECT new com.shadcn.backend.dto.PelaksanaanDetailDto(" +
           "p.id, CAST(p.status AS string), p.catatan, p.createdAt, p.updatedAt, " +
           "u.id, u.judul, u.rencanaKegiatan, u.tanggalMulai, u.tanggalSelesai, " +
           "u.durasiUsulan, u.gambarUrl, u.namaPengusul, u.emailPengusul, " +
           "u.jumlahUpvote, u.jumlahDownvote, CAST(u.status AS string), u.createdAt, u.updatedAt) " +
           "FROM Pelaksanaan p " +
           "JOIN p.usulan u " +
           "WHERE p.id = :id")
    Optional<PelaksanaanDetailDto> findPelaksanaanDetailById(@Param("id") Long id);
    
    Page<Pelaksanaan> findAllByOrderByUpdatedAtDesc(Pageable pageable);
    
    Page<Pelaksanaan> findByStatusOrderByUpdatedAtDesc(Pelaksanaan.StatusPelaksanaan status, Pageable pageable);// Advanced search with multiple filters
    @Query(value = """
        SELECT p.* FROM pelaksanaan p 
        JOIN usulan u ON p.usulan_id = u.id 
        WHERE 
        (:judul IS NULL OR LOWER(u.judul) LIKE LOWER(CONCAT('%', :judul, '%'))) AND
        (:namaPengusul IS NULL OR LOWER(u.nama_pengusul) LIKE LOWER(CONCAT('%', :namaPengusul, '%'))) AND
        (:status IS NULL OR p.status = :status) AND
        (:tanggalSelesaiFrom IS NULL OR u.tanggal_selesai >= :tanggalSelesaiFrom) AND
        (:tanggalSelesaiTo IS NULL OR u.tanggal_selesai <= :tanggalSelesaiTo)
        ORDER BY 
        CASE WHEN :sortBy = 'judul' AND :sortDirection = 'asc' THEN u.judul END ASC,
        CASE WHEN :sortBy = 'judul' AND :sortDirection = 'desc' THEN u.judul END DESC,
        CASE WHEN :sortBy = 'tanggalSelesai' AND :sortDirection = 'asc' THEN u.tanggal_selesai END ASC,
        CASE WHEN :sortBy = 'tanggalSelesai' AND :sortDirection = 'desc' THEN u.tanggal_selesai END DESC,
        CASE WHEN :sortBy = 'status' AND :sortDirection = 'asc' THEN p.status END ASC,
        CASE WHEN :sortBy = 'status' AND :sortDirection = 'desc' THEN p.status END DESC,
        CASE WHEN :sortBy = 'createdAt' AND :sortDirection = 'asc' THEN p.created_at END ASC,
        CASE WHEN :sortBy = 'createdAt' AND :sortDirection = 'desc' THEN p.created_at END DESC,
        p.updated_at DESC
        """,
        countQuery = """
        SELECT COUNT(*) FROM pelaksanaan p 
        JOIN usulan u ON p.usulan_id = u.id 
        WHERE 
        (:judul IS NULL OR LOWER(u.judul) LIKE LOWER(CONCAT('%', :judul, '%'))) AND
        (:namaPengusul IS NULL OR LOWER(u.nama_pengusul) LIKE LOWER(CONCAT('%', :namaPengusul, '%'))) AND
        (:status IS NULL OR p.status = :status) AND
        (:tanggalSelesaiFrom IS NULL OR u.tanggal_selesai >= :tanggalSelesaiFrom) AND
        (:tanggalSelesaiTo IS NULL OR u.tanggal_selesai <= :tanggalSelesaiTo)
        """,
        nativeQuery = true)
    Page<Pelaksanaan> searchPelaksanaanWithFilters(
        @Param("judul") String judul,
        @Param("namaPengusul") String namaPengusul,
        @Param("status") String status,
        @Param("tanggalSelesaiFrom") LocalDate tanggalSelesaiFrom,
        @Param("tanggalSelesaiTo") LocalDate tanggalSelesaiTo,
        @Param("sortBy") String sortBy,
        @Param("sortDirection") String sortDirection,
        Pageable pageable    );
    
    // Optimized query for pelaksanaan list summary to avoid N+1 queries
    @Query("SELECT new com.shadcn.backend.dto.PelaksanaanSummaryDto(" +
           "p.id, CAST(p.status AS string), p.catatan, p.createdAt, p.updatedAt, " +
           "u.id, u.judul, u.rencanaKegiatan, u.tanggalMulai, u.tanggalSelesai, " +
           "u.durasiUsulan, u.gambarUrl, u.namaPengusul, u.emailPengusul, " +
           "u.jumlahUpvote, u.jumlahDownvote, CAST(u.status AS string), u.createdAt, u.updatedAt, " +
           "0L, 0L, 0L) " +
           "FROM Pelaksanaan p " +
           "JOIN p.usulan u " +
           "WHERE " +
           "(:judul IS NULL OR LOWER(u.judul) LIKE LOWER(CONCAT('%', :judul, '%'))) AND " +
           "(:namaPengusul IS NULL OR LOWER(u.namaPengusul) LIKE LOWER(CONCAT('%', :namaPengusul, '%'))) AND " +
           "(:status IS NULL OR CAST(p.status AS string) = :status) AND " +
           "(:tanggalSelesaiFrom IS NULL OR u.tanggalSelesai >= :tanggalSelesaiFrom) AND " +
           "(:tanggalSelesaiTo IS NULL OR u.tanggalSelesai <= :tanggalSelesaiTo) " +
           "ORDER BY " +
           "CASE WHEN :sortBy = 'judul' AND :sortDirection = 'asc' THEN u.judul END ASC, " +
           "CASE WHEN :sortBy = 'judul' AND :sortDirection = 'desc' THEN u.judul END DESC, " +
           "CASE WHEN :sortBy = 'tanggalSelesai' AND :sortDirection = 'asc' THEN u.tanggalSelesai END ASC, " +
           "CASE WHEN :sortBy = 'tanggalSelesai' AND :sortDirection = 'desc' THEN u.tanggalSelesai END DESC, " +
           "CASE WHEN :sortBy = 'status' AND :sortDirection = 'asc' THEN p.status END ASC, " +
           "CASE WHEN :sortBy = 'status' AND :sortDirection = 'desc' THEN p.status END DESC, " +
           "CASE WHEN :sortBy = 'createdAt' AND :sortDirection = 'asc' THEN p.createdAt END ASC, " +
           "CASE WHEN :sortBy = 'createdAt' AND :sortDirection = 'desc' THEN p.createdAt END DESC, " +
           "p.updatedAt DESC")
    Page<PelaksanaanSummaryDto> searchPelaksanaanSummaryWithFilters(
        @Param("judul") String judul,
        @Param("namaPengusul") String namaPengusul,
        @Param("status") String status,
        @Param("tanggalSelesaiFrom") LocalDate tanggalSelesaiFrom,
        @Param("tanggalSelesaiTo") LocalDate tanggalSelesaiTo,
        @Param("sortBy") String sortBy,
        @Param("sortDirection") String sortDirection,
        Pageable pageable
    );
}
