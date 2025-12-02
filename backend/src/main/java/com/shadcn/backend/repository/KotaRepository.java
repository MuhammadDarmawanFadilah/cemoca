package com.shadcn.backend.repository;

import com.shadcn.backend.model.Kota;
import com.shadcn.backend.model.Provinsi;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KotaRepository extends JpaRepository<Kota, Long> {
    
    Optional<Kota> findByKode(String kode);
    
    Optional<Kota> findByNama(String nama);
    
    @Query("SELECT k FROM Kota k WHERE k.provinsi.id = :provinsiId ORDER BY k.nama ASC")
    List<Kota> findByProvinsiIdOrderByNama(@Param("provinsiId") Long provinsiId);
    
    @Query("SELECT k FROM Kota k WHERE k.provinsi.kode = :provinsiKode ORDER BY k.nama ASC")
    List<Kota> findByProvinsiKodeOrderByNama(@Param("provinsiKode") String provinsiKode);
    
    @Query("SELECT k FROM Kota k WHERE k.provinsi.nama = :provinsiNama ORDER BY k.nama ASC")
    List<Kota> findByProvinsiNamaOrderByNama(@Param("provinsiNama") String provinsiNama);
    
    List<Kota> findByProvinsi(Provinsi provinsi);
    
    // Search with pagination and filtering
    @Query("SELECT k FROM Kota k WHERE " +
           "(:search IS NULL OR LOWER(k.nama) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(k.kode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(k.tipe) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(k.provinsi.nama) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:provinsiId IS NULL OR k.provinsi.id = :provinsiId) " +
           "ORDER BY k.provinsi.nama ASC, k.nama ASC")
    Page<Kota> findWithFilters(@Param("search") String search,
                              @Param("provinsiId") Long provinsiId,
                              Pageable pageable);
      boolean existsByKode(String kode);
    
    boolean existsByNama(String nama);
    
    // Count kota by provinsi ID
    @Query("SELECT COUNT(k) FROM Kota k WHERE k.provinsi.id = :provinsiId")
    int countByProvinsiId(@Param("provinsiId") Long provinsiId);
    
    // Check if kode exists (for validation, excluding current id)
    boolean existsByKodeAndIdNot(String kode, Long id);
    
    // Check if nama exists (for validation, excluding current id)
    boolean existsByNamaAndIdNot(String nama, Long id);
}
