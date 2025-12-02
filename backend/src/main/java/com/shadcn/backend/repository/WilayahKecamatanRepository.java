package com.shadcn.backend.repository;

import com.shadcn.backend.model.WilayahKecamatan;
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
public interface WilayahKecamatanRepository extends JpaRepository<WilayahKecamatan, String> {
    
    Optional<WilayahKecamatan> findByKode(String kode);
    
    List<WilayahKecamatan> findByKotaKode(String kotaKode);
    
    Page<WilayahKecamatan> findByKotaKode(String kotaKode, Pageable pageable);
    
    Optional<WilayahKecamatan> findByNamaIgnoreCase(String nama);
    
    boolean existsByKode(String kode);
    
    Page<WilayahKecamatan> findByNamaContainingIgnoreCase(String nama, Pageable pageable);
    
    Page<WilayahKecamatan> findByKotaKodeAndNamaContainingIgnoreCase(String kotaKode, String nama, Pageable pageable);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM WilayahKecamatan w WHERE w.kode = :kode")
    void deleteByKode(@Param("kode") String kode);
}
