package com.shadcn.backend.repository;

import com.shadcn.backend.model.Kategori;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KategoriRepository extends JpaRepository<Kategori, Long> {
    
    Optional<Kategori> findByNama(String nama);
    
    boolean existsByNama(String nama);
    
    @Query("SELECT k FROM Kategori k WHERE k.nama LIKE %:nama%")
    List<Kategori> findByNamaContainingIgnoreCase(@Param("nama") String nama);
    
    @Query("SELECT k FROM Kategori k ORDER BY k.nama ASC")
    List<Kategori> findAllOrderByNama();
    
    List<Kategori> findAllByOrderByNamaAsc();
    
    boolean existsByNamaIgnoreCase(String nama);
    
    boolean existsByNamaIgnoreCaseAndIdNot(String nama, Long id);
}