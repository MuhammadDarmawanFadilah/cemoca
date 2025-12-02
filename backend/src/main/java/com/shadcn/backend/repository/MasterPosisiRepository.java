package com.shadcn.backend.repository;

import com.shadcn.backend.model.MasterPosisi;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MasterPosisiRepository extends JpaRepository<MasterPosisi, Long> {
    
    // Find by name (case insensitive)
    Optional<MasterPosisi> findByNamaIgnoreCase(String nama);
    
    // Find all active positions ordered by sort order and name
    List<MasterPosisi> findByIsActiveTrueOrderBySortOrderAscNamaAsc();
    
    // Find by category
    List<MasterPosisi> findByKategoriAndIsActiveTrueOrderBySortOrderAscNamaAsc(String kategori);
    
    // Search with pagination and filtering
    @Query("SELECT mp FROM MasterPosisi mp WHERE " +
           "(:search IS NULL OR LOWER(mp.nama) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(mp.deskripsi) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:kategori IS NULL OR mp.kategori = :kategori) AND " +
           "(:isActive IS NULL OR mp.isActive = :isActive) " +
           "ORDER BY mp.sortOrder ASC, mp.nama ASC")
    Page<MasterPosisi> findWithFilters(@Param("search") String search,
                                     @Param("kategori") String kategori,
                                     @Param("isActive") Boolean isActive, 
                                     Pageable pageable);
    
    // Check if name exists (for validation, excluding current id)
    boolean existsByNamaIgnoreCaseAndIdNot(String nama, Long id);
    
    // Get distinct categories
    @Query("SELECT DISTINCT mp.kategori FROM MasterPosisi mp WHERE mp.kategori IS NOT NULL ORDER BY mp.kategori")
    List<String> findDistinctKategori();
    
    // Count active positions
    long countByIsActiveTrue();
}
