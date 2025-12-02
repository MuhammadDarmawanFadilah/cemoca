package com.shadcn.backend.repository;

import com.shadcn.backend.model.KomentarPelaksanaan;
import com.shadcn.backend.dto.KomentarPelaksanaanDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KomentarPelaksanaanRepository extends JpaRepository<KomentarPelaksanaan, Long> {
    
    // Find comments by pelaksanaan id, only parent comments (no replies)
    @Query("SELECT k FROM KomentarPelaksanaan k WHERE k.pelaksanaan.id = :pelaksanaanId AND k.parentKomentar IS NULL ORDER BY k.tanggalKomentar DESC")
    Page<KomentarPelaksanaan> findByPelaksanaanIdAndParentKomentarIsNullOrderByTanggalKomentarDesc(@Param("pelaksanaanId") Long pelaksanaanId, Pageable pageable);
    
    // Find all comments by pelaksanaan id (including replies)
    List<KomentarPelaksanaan> findByPelaksanaanIdOrderByTanggalKomentarAsc(Long pelaksanaanId);
    
    // Count comments by pelaksanaan id
    long countByPelaksanaanId(Long pelaksanaanId);    // Get parent comments as DTOs without lazy loading issues
    @Query("SELECT new com.shadcn.backend.dto.KomentarPelaksanaanDto(" +
           "k.id, k.konten, k.namaPengguna, k.biografiId, k.tanggalKomentar, k.updatedAt, k.likes, k.dislikes) " +
           "FROM KomentarPelaksanaan k " +
           "WHERE k.pelaksanaan.id = :pelaksanaanId AND k.parentKomentar IS NULL " +
           "ORDER BY k.tanggalKomentar DESC")
    Page<KomentarPelaksanaanDto> findParentCommentsDtoByPelaksanaanId(@Param("pelaksanaanId") Long pelaksanaanId, Pageable pageable);
    
    // Get replies for a parent comment as DTOs
    @Query("SELECT new com.shadcn.backend.dto.KomentarPelaksanaanDto(" +
           "k.id, k.konten, k.namaPengguna, k.biografiId, k.tanggalKomentar, k.updatedAt, k.likes, k.dislikes) " +
           "FROM KomentarPelaksanaan k " +
           "WHERE k.parentKomentar.id = :parentId " +
           "ORDER BY k.tanggalKomentar ASC")
    List<KomentarPelaksanaanDto> findRepliesDtoByParentId(@Param("parentId") Long parentId);
}
