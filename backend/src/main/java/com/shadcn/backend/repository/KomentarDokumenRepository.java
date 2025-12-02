package com.shadcn.backend.repository;

import com.shadcn.backend.model.KomentarDokumen;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KomentarDokumenRepository extends JpaRepository<KomentarDokumen, Long> {
    
    @Query("SELECT k FROM KomentarDokumen k WHERE k.dokumentId = :dokumentId AND k.parentKomentar IS NULL ORDER BY k.tanggalKomentar DESC")
    List<KomentarDokumen> findByDokumenIdAndParentKomentarIsNull(@Param("dokumentId") Long dokumentId);
    
    @Query("SELECT k FROM KomentarDokumen k WHERE k.dokumentId = :dokumentId AND k.parentKomentar IS NULL ORDER BY k.tanggalKomentar DESC")
    Page<KomentarDokumen> findByDokumenIdAndParentKomentarIsNull(@Param("dokumentId") Long dokumentId, Pageable pageable);
    
    @Query("SELECT k FROM KomentarDokumen k WHERE k.parentKomentar.id = :parentId ORDER BY k.tanggalKomentar ASC")
    List<KomentarDokumen> findByParentKomentarId(@Param("parentId") Long parentId);
      @Query("SELECT COUNT(k) FROM KomentarDokumen k WHERE k.dokumentId = :dokumentId")
    long countByDokumenId(@Param("dokumentId") Long dokumentId);
}
