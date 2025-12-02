package com.shadcn.backend.repository;

import com.shadcn.backend.model.WilayahKelurahan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface WilayahKelurahanRepository extends JpaRepository<WilayahKelurahan, String> {
    
    Optional<WilayahKelurahan> findByKode(String kode);
    
    List<WilayahKelurahan> findByKecamatanKode(String kecamatanKode);
    
    Page<WilayahKelurahan> findByKecamatanKode(String kecamatanKode, Pageable pageable);
    
    Optional<WilayahKelurahan> findByNamaIgnoreCase(String nama);
    
    boolean existsByKode(String kode);
    
    Page<WilayahKelurahan> findByNamaContainingIgnoreCase(String nama, Pageable pageable);
    
    Page<WilayahKelurahan> findByKecamatanKodeAndNamaContainingIgnoreCase(String kecamatanKode, String nama, Pageable pageable);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM WilayahKelurahan w WHERE w.kode = :kode")
    void deleteByKode(@Param("kode") String kode);
}
