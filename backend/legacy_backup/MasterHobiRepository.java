package com.shadcn.backend.repository;

import com.shadcn.backend.model.MasterHobi;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MasterHobiRepository extends JpaRepository<MasterHobi, Long> {
    
    // Find by name (case insensitive)
    Optional<MasterHobi> findByNamaIgnoreCase(String nama);
    
    // Find all active hobbies ordered by sort order and name
    List<MasterHobi> findByIsActiveTrueOrderBySortOrderAscNamaAsc();
    
    // Find by category
    List<MasterHobi> findByKategoriAndIsActiveTrueOrderBySortOrderAscNamaAsc(String kategori);
    
    // Search with pagination and filtering
    @Query("SELECT mh FROM MasterHobi mh WHERE " +
           "(:search IS NULL OR LOWER(mh.nama) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(mh.deskripsi) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:kategori IS NULL OR mh.kategori = :kategori) AND " +
           "(:isActive IS NULL OR mh.isActive = :isActive) " +
           "ORDER BY mh.sortOrder ASC, mh.nama ASC")
    Page<MasterHobi> findWithFilters(@Param("search") String search,
                                   @Param("kategori") String kategori,
                                   @Param("isActive") Boolean isActive, 
                                   Pageable pageable);
    
    // Check if name exists (for validation, excluding current id)
    boolean existsByNamaIgnoreCaseAndIdNot(String nama, Long id);
    
    // Get distinct categories
    @Query("SELECT DISTINCT mh.kategori FROM MasterHobi mh WHERE mh.kategori IS NOT NULL ORDER BY mh.kategori")
    List<String> findDistinctKategori();
    
    // Count active hobbies
    long countByIsActiveTrue();
}
