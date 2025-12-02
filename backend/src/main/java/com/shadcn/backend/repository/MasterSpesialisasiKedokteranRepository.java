package com.shadcn.backend.repository;

import com.shadcn.backend.model.MasterSpesialisasiKedokteran;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MasterSpesialisasiKedokteranRepository extends JpaRepository<MasterSpesialisasiKedokteran, Long> {
    
    // Find by name (case insensitive)
    Optional<MasterSpesialisasiKedokteran> findByNamaIgnoreCase(String nama);
    
    // Find all active spesialisasi kedokteran ordered by sort order and name
    List<MasterSpesialisasiKedokteran> findByIsActiveTrueOrderBySortOrderAscNamaAsc();
    
    // Search with pagination and filtering
    @Query("SELECT msk FROM MasterSpesialisasiKedokteran msk WHERE " +
           "(:search IS NULL OR LOWER(msk.nama) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(msk.deskripsi) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:isActive IS NULL OR msk.isActive = :isActive) " +
           "ORDER BY msk.sortOrder ASC, msk.nama ASC")
    Page<MasterSpesialisasiKedokteran> findWithFilters(@Param("search") String search,
                                                      @Param("isActive") Boolean isActive, 
                                                      Pageable pageable);
    
    // Check if name exists (for validation, excluding current id)
    boolean existsByNamaIgnoreCaseAndIdNot(String nama, Long id);
    
    // Count active spesialisasi kedokteran
    long countByIsActiveTrue();
}
