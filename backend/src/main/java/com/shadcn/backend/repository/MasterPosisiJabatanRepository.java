package com.shadcn.backend.repository;

import com.shadcn.backend.model.MasterPosisiJabatan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MasterPosisiJabatanRepository extends JpaRepository<MasterPosisiJabatan, Long> {
    
    // Find by name (case insensitive)
    Optional<MasterPosisiJabatan> findByNamaIgnoreCase(String nama);
    
    // Find all active posisi jabatan ordered by sort order and name
    List<MasterPosisiJabatan> findByIsActiveTrueOrderBySortOrderAscNamaAsc();
    
    // Search with pagination and filtering
    @Query("SELECT mpj FROM MasterPosisiJabatan mpj WHERE " +
           "(:search IS NULL OR LOWER(mpj.nama) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(mpj.deskripsi) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:isActive IS NULL OR mpj.isActive = :isActive) " +
           "ORDER BY mpj.sortOrder ASC, mpj.nama ASC")
    Page<MasterPosisiJabatan> findWithFilters(@Param("search") String search,
                                             @Param("isActive") Boolean isActive, 
                                             Pageable pageable);
    
    // Check if name exists (for validation, excluding current id)
    boolean existsByNamaIgnoreCaseAndIdNot(String nama, Long id);
    
    // Count active posisi jabatan
    long countByIsActiveTrue();
}
