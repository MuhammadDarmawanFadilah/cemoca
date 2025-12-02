package com.shadcn.backend.repository;

import com.shadcn.backend.model.KomentarBerita;
import com.shadcn.backend.dto.KomentarBeritaDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KomentarBeritaRepository extends JpaRepository<KomentarBerita, Long> {    
    // Find comments by berita ID (only parent comments, no replies)
    @Query("SELECT k FROM KomentarBerita k WHERE k.berita.id = :beritaId AND k.parentKomentar IS NULL ORDER BY k.tanggalKomentar DESC")
    Page<KomentarBerita> findByBeritaIdAndParentKomentarIsNull(@Param("beritaId") Long beritaId, Pageable pageable);
    
    // Find all parent comments without pagination
    @Query("SELECT k FROM KomentarBerita k WHERE k.berita.id = :beritaId AND k.parentKomentar IS NULL ORDER BY k.tanggalKomentar DESC")
    List<KomentarBerita> findByBeritaIdAndParentKomentarIsNullOrderByTanggalKomentarDesc(@Param("beritaId") Long beritaId);
    
    // Find replies for a specific comment
    List<KomentarBerita> findByParentKomentarIdOrderByTanggalKomentarAsc(Long parentKomentarId);
    
    // Count comments for a berita (excluding replies)
    @Query("SELECT COUNT(k) FROM KomentarBerita k WHERE k.berita.id = :beritaId")
    long countByBeritaId(@Param("beritaId") Long beritaId);
    
    // Find all comments for a berita (including replies)
    List<KomentarBerita> findByBeritaIdOrderByTanggalKomentarDesc(Long beritaId);
    
    // Dashboard methods
    List<KomentarBerita> findTop5ByOrderByTanggalKomentarDesc();
    
    // Efficiently get parent comments and their replies in separate queries to avoid N+1
    @Query("SELECT k FROM KomentarBerita k WHERE k.berita.id = :beritaId AND k.parentKomentar IS NULL ORDER BY k.tanggalKomentar DESC")
    List<KomentarBerita> findParentCommentsByBeritaId(@Param("beritaId") Long beritaId);
    
    @Query("SELECT k FROM KomentarBerita k WHERE k.parentKomentar.id IN :parentIds ORDER BY k.parentKomentar.id, k.tanggalKomentar ASC")
    List<KomentarBerita> findRepliesByParentIds(@Param("parentIds") List<Long> parentIds);
    
    // Get parent comments as DTOs without lazy loading issues
    @Query("SELECT new com.shadcn.backend.dto.KomentarBeritaDto(" +
           "k.id, k.konten, k.namaPengguna, k.biografiId, k.tanggalKomentar, k.updatedAt, k.likes, k.dislikes) " +
           "FROM KomentarBerita k " +
           "WHERE k.berita.id = :beritaId AND k.parentKomentar IS NULL " +
           "ORDER BY k.tanggalKomentar DESC")
    Page<KomentarBeritaDto> findParentCommentsDtoByBeritaId(@Param("beritaId") Long beritaId, Pageable pageable);
    
    // Get replies for a parent comment as DTOs
    @Query("SELECT new com.shadcn.backend.dto.KomentarBeritaDto(" +
           "k.id, k.konten, k.namaPengguna, k.biografiId, k.tanggalKomentar, k.updatedAt, k.likes, k.dislikes) " +
           "FROM KomentarBerita k " +
           "WHERE k.parentKomentar.id = :parentId " +
           "ORDER BY k.tanggalKomentar ASC")
    List<KomentarBeritaDto> findRepliesDtoByParentId(@Param("parentId") Long parentId);
}
