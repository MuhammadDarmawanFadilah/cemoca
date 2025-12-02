package com.shadcn.backend.repository;

import com.shadcn.backend.model.WilayahKota;
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
public interface WilayahKotaRepository extends JpaRepository<WilayahKota, String> {
    
    Optional<WilayahKota> findByKode(String kode);
    
    List<WilayahKota> findByProvinsiKode(String provinsiKode);
    
    Page<WilayahKota> findByProvinsiKode(String provinsiKode, Pageable pageable);
    
    Optional<WilayahKota> findByNamaIgnoreCase(String nama);
    
    boolean existsByKode(String kode);
    
    Page<WilayahKota> findByNamaContainingIgnoreCase(String nama, Pageable pageable);
    
    Page<WilayahKota> findByProvinsiKodeAndNamaContainingIgnoreCase(String provinsiKode, String nama, Pageable pageable);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM WilayahKota w WHERE w.kode = :kode")
    void deleteByKode(@Param("kode") String kode);
}
