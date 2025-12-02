package com.shadcn.backend.repository;

import com.shadcn.backend.model.KomentarDocument;
import com.shadcn.backend.dto.KomentarDocumentDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KomentarDocumentRepository extends JpaRepository<KomentarDocument, Long> {
    
    Page<KomentarDocument> findByDocumentIdAndParentKomentarIsNullOrderByTanggalKomentarDesc(Long documentId, Pageable pageable);
    
    List<KomentarDocument> findByDocumentIdAndParentKomentarIsNullOrderByTanggalKomentarDesc(Long documentId);
    
    List<KomentarDocument> findByParentKomentarIdOrderByTanggalKomentarAsc(Long parentId);
    
    long countByDocumentId(Long documentId);
    
    // Get parent comments as DTOs without lazy loading issues
    @Query("SELECT new com.shadcn.backend.dto.KomentarDocumentDto(" +
           "k.id, k.konten, k.namaPengguna, k.biografiId, k.tanggalKomentar, k.updatedAt, k.likes, k.dislikes) " +
           "FROM KomentarDocument k " +
           "WHERE k.document.id = :documentId AND k.parentKomentar IS NULL " +
           "ORDER BY k.tanggalKomentar DESC")
    Page<KomentarDocumentDto> findParentCommentsDtoByDocumentId(@Param("documentId") Long documentId, Pageable pageable);
    
    // Get replies for a parent comment as DTOs
    @Query("SELECT new com.shadcn.backend.dto.KomentarDocumentDto(" +
           "k.id, k.konten, k.namaPengguna, k.biografiId, k.tanggalKomentar, k.updatedAt, k.likes, k.dislikes) " +
           "FROM KomentarDocument k " +
           "WHERE k.parentKomentar.id = :parentId " +
           "ORDER BY k.tanggalKomentar ASC")
    List<KomentarDocumentDto> findRepliesDtoByParentId(@Param("parentId") Long parentId);
}
