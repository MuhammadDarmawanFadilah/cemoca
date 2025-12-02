package com.shadcn.backend.repository;

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
public interface ProvinsiRepository extends JpaRepository<Provinsi, Long> {
    
    Optional<Provinsi> findByKode(String kode);
    
    Optional<Provinsi> findByNama(String nama);
    
    @Query("SELECT p FROM Provinsi p ORDER BY p.nama ASC")
    List<Provinsi> findAllOrderByNama();
    
    // Search with pagination and filtering
    @Query("SELECT p FROM Provinsi p WHERE " +
           "(:search IS NULL OR LOWER(p.nama) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.kode) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY p.nama ASC")
    Page<Provinsi> findWithFilters(@Param("search") String search, Pageable pageable);
    
    boolean existsByKode(String kode);
    
    boolean existsByNama(String nama);
    
    // Check if kode exists (for validation, excluding current id)
    boolean existsByKodeAndIdNot(String kode, Long id);
    
    // Check if nama exists (for validation, excluding current id)
    boolean existsByNamaAndIdNot(String nama, Long id);
}
