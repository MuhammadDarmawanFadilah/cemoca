package com.shadcn.backend.repository;

import com.shadcn.backend.model.DokumentasiPelaksanaan;
import com.shadcn.backend.dto.DokumentasiSummaryDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DokumentasiPelaksanaanRepository extends JpaRepository<DokumentasiPelaksanaan, Long> {
    
    // Efficient query for dokumentasi summary - only select needed fields
    @Query("SELECT new com.shadcn.backend.dto.DokumentasiSummaryDto(" +
           "dp.id, dp.fotoUrl, dp.judul, dp.deskripsi, dp.namaUploader, dp.emailUploader, dp.createdAt) " +
           "FROM DokumentasiPelaksanaan dp " +
           "WHERE dp.pelaksanaan.id = :pelaksanaanId " +
           "ORDER BY dp.createdAt DESC")
    List<DokumentasiSummaryDto> findDokumentasiSummaryByPelaksanaanId(@Param("pelaksanaanId") Long pelaksanaanId);
    
    List<DokumentasiPelaksanaan> findByPelaksanaanIdOrderByCreatedAtDesc(Long pelaksanaanId);
    
    long countByPelaksanaanId(Long pelaksanaanId);
}
