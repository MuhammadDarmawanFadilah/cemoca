package com.shadcn.backend.repository;

import com.shadcn.backend.model.WilayahProvinsi;
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
public interface WilayahProvinsiRepository extends JpaRepository<WilayahProvinsi, String> {
    
    Optional<WilayahProvinsi> findByKode(String kode);
    
    Optional<WilayahProvinsi> findByNamaIgnoreCase(String nama);
    
    boolean existsByKode(String kode);
    
    Page<WilayahProvinsi> findByNamaContainingIgnoreCase(String nama, Pageable pageable);
    
    List<WilayahProvinsi> findByKodeIn(List<String> kodes);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM WilayahProvinsi w WHERE w.kode = :kode")
    void deleteByKode(@Param("kode") String kode);
}
