package com.shadcn.backend.repository;

import com.shadcn.backend.model.MasterAgama;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MasterAgamaRepository extends JpaRepository<MasterAgama, Long> {
    
    // Find by name (case insensitive)
    Optional<MasterAgama> findByNamaIgnoreCase(String nama);
    
    // Find all active agama ordered by sort order and name
    List<MasterAgama> findByIsActiveTrueOrderBySortOrderAscNamaAsc();
    
    // Search with pagination and filtering
    @Query("SELECT ma FROM MasterAgama ma WHERE " +
           "(:search IS NULL OR LOWER(ma.nama) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:isActive IS NULL OR ma.isActive = :isActive) " +
           "ORDER BY ma.sortOrder ASC, ma.nama ASC")
    Page<MasterAgama> findWithFilters(@Param("search") String search,
                                     @Param("isActive") Boolean isActive, 
                                     Pageable pageable);
    
    // Check if name exists (for validation, excluding current id)
    boolean existsByNamaIgnoreCaseAndIdNot(String nama, Long id);
    
    // Count active agama
    long countByIsActiveTrue();
}
