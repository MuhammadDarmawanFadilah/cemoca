package com.shadcn.backend.repository;

import com.shadcn.backend.model.MasterSpesialisasi;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MasterSpesialisasiRepository extends JpaRepository<MasterSpesialisasi, Long> {
    
    // Find by name (case insensitive)
    Optional<MasterSpesialisasi> findByNamaIgnoreCase(String nama);
    
    // Find all active specializations ordered by sort order and name
    List<MasterSpesialisasi> findByIsActiveTrueOrderBySortOrderAscNamaAsc();
    
    // Search with pagination and filtering
    @Query("SELECT ms FROM MasterSpesialisasi ms WHERE " +
           "(:search IS NULL OR LOWER(ms.nama) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(ms.deskripsi) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:isActive IS NULL OR ms.isActive = :isActive) " +
           "ORDER BY ms.sortOrder ASC, ms.nama ASC")
    Page<MasterSpesialisasi> findWithFilters(@Param("search") String search, 
                                           @Param("isActive") Boolean isActive, 
                                           Pageable pageable);
    
    // Check if name exists (for validation, excluding current id)
    boolean existsByNamaIgnoreCaseAndIdNot(String nama, Long id);
    
    // Count active specializations
    long countByIsActiveTrue();
}
