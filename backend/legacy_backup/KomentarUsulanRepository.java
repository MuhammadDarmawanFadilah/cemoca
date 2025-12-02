package com.shadcn.backend.repository;

import com.shadcn.backend.model.KomentarUsulan;
import com.shadcn.backend.dto.KomentarUsulanDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KomentarUsulanRepository extends JpaRepository<KomentarUsulan, Long> {
    
    // Find comments by usulan id, only parent comments (no replies)
    @Query("SELECT k FROM KomentarUsulan k WHERE k.usulan.id = :usulanId AND k.parentKomentar IS NULL ORDER BY k.tanggalKomentar DESC")
    Page<KomentarUsulan> findByUsulanIdAndParentKomentarIsNullOrderByTanggalKomentarDesc(@Param("usulanId") Long usulanId, Pageable pageable);
    
    // Find all comments by usulan id (including replies)
    List<KomentarUsulan> findByUsulanIdOrderByTanggalKomentarAsc(Long usulanId);
    
    // Count comments by usulan id
    long countByUsulanId(Long usulanId);
    
    // Get parent comments as DTOs without lazy loading issues
    @Query("SELECT new com.shadcn.backend.dto.KomentarUsulanDto(" +
           "k.id, k.konten, k.namaPengguna, k.biografiId, k.tanggalKomentar, k.updatedAt, k.likes, k.dislikes) " +
           "FROM KomentarUsulan k " +
           "WHERE k.usulan.id = :usulanId AND k.parentKomentar IS NULL " +
           "ORDER BY k.tanggalKomentar DESC")
    Page<KomentarUsulanDto> findParentCommentsDtoByUsulanId(@Param("usulanId") Long usulanId, Pageable pageable);
    
    // Get replies for a parent comment as DTOs
    @Query("SELECT new com.shadcn.backend.dto.KomentarUsulanDto(" +
           "k.id, k.konten, k.namaPengguna, k.biografiId, k.tanggalKomentar, k.updatedAt, k.likes, k.dislikes) " +
           "FROM KomentarUsulan k " +
           "WHERE k.parentKomentar.id = :parentId " +
           "ORDER BY k.tanggalKomentar ASC")
    List<KomentarUsulanDto> findRepliesDtoByParentId(@Param("parentId") Long parentId);
    
    // Dashboard methods
    List<KomentarUsulan> findTop5ByOrderByTanggalKomentarDesc();
}
