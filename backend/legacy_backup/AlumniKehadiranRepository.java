package com.shadcn.backend.repository;

import com.shadcn.backend.model.AlumniKehadiran;
import com.shadcn.backend.dto.ParticipantSummaryDto;
import com.shadcn.backend.dto.AlumniKehadiranDto;
import com.shadcn.backend.dto.AlumniKehadiranFullDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlumniKehadiranRepository extends JpaRepository<AlumniKehadiran, Long> {
      // Efficient query for participant summary - only select needed fields
    @Query("SELECT new com.shadcn.backend.dto.ParticipantSummaryDto(" +
           "ak.biografi.biografiId, ak.biografi.namaLengkap, ak.hadir) " +
           "FROM AlumniKehadiran ak " +
           "WHERE ak.pelaksanaan.id = :pelaksanaanId " +
           "ORDER BY ak.biografi.namaLengkap ASC")
    List<ParticipantSummaryDto> findParticipantSummaryByPelaksanaanId(@Param("pelaksanaanId") Long pelaksanaanId);
    
    // Basic query - avoid N+1 by using fetch join (only when full objects needed)
    @Query("SELECT ak FROM AlumniKehadiran ak " +
           "JOIN FETCH ak.biografi " +
           "WHERE ak.pelaksanaan.id = :pelaksanaanId " +
           "ORDER BY ak.biografi.namaLengkap ASC")
    List<AlumniKehadiran> findByPelaksanaanId(@Param("pelaksanaanId") Long pelaksanaanId);
    
    Optional<AlumniKehadiran> findByPelaksanaanIdAndBiografiBiografiId(Long pelaksanaanId, Long biografiId);
    
    @Modifying
    @Query("DELETE FROM AlumniKehadiran ak WHERE ak.pelaksanaan.id = :pelaksanaanId")
    void deleteByPelaksanaanId(@Param("pelaksanaanId") Long pelaksanaanId);
    
    long countByPelaksanaanIdAndHadirTrue(Long pelaksanaanId);
    
    // Full participant data query - avoid lazy loading issues
    @Query("SELECT new com.shadcn.backend.dto.AlumniKehadiranFullDto(" +
           "ak.id, ak.hadir, ak.catatan, ak.createdAt, ak.updatedAt, " +
           "b.biografiId, b.namaLengkap, b.nim, b.alumniTahun, b.email, b.nomorTelepon, " +
           "b.fotoProfil, b.jurusan, b.tanggalLulus, b.ipk, b.tanggalLahir, b.tempatLahir, " +
           "b.jenisKelamin, b.agama, b.foto, b.programStudi, b.pendidikanLanjutan, " +
           "b.tanggalMasukKerja, b.tanggalKeluarKerja, b.alamat, b.kota, b.provinsi, " +
           "b.kecamatan, b.kelurahan, b.kodePos, b.prestasi, b.hobi, b.instagram, " +
           "b.youtube, b.linkedin, b.facebook, b.tiktok, b.telegram, b.catatan, " +
           "b.status, b.createdAt, b.updatedAt) " +
           "FROM AlumniKehadiran ak " +
           "JOIN ak.biografi b " +
           "WHERE ak.pelaksanaan.id = :pelaksanaanId " +
           "ORDER BY b.namaLengkap ASC")
    List<AlumniKehadiranFullDto> findFullParticipantsByPelaksanaanId(@Param("pelaksanaanId") Long pelaksanaanId);
    
    // Query untuk mengambil data participants sebagai DTO tanpa lazy loading issues
    @Query("SELECT new com.shadcn.backend.dto.AlumniKehadiranDto(" +
           "ak.id, ak.hadir, ak.catatan, ak.createdAt, ak.updatedAt, " +
           "b.biografiId, b.namaLengkap, b.nim, b.alumniTahun, b.email, b.nomorTelepon, " +
           "b.fotoProfil, b.jurusan, b.tanggalLulus, b.ipk, b.kota, b.provinsi, " +
           "CAST(b.status AS string)) " +
           "FROM AlumniKehadiran ak " +
           "JOIN ak.biografi b " +
           "WHERE ak.pelaksanaan.id = :pelaksanaanId " +
           "ORDER BY b.namaLengkap ASC")
    List<AlumniKehadiranDto> findParticipantsWithoutLazyLoading(@Param("pelaksanaanId") Long pelaksanaanId);
}
