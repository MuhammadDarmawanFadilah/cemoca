package com.shadcn.backend.repository;

import com.shadcn.backend.model.Barang;
import com.shadcn.backend.model.Kategori;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BarangRepository extends JpaRepository<Barang, Long>, JpaSpecificationExecutor<Barang> {
    
    List<Barang> findByKategori(Kategori kategori);
    
    List<Barang> findByKategoriId(Long kategoriId);
    
    @Query("SELECT b FROM Barang b WHERE b.nama LIKE %:nama%")
    List<Barang> findByNamaContainingIgnoreCase(@Param("nama") String nama);
    
    @Query("SELECT b FROM Barang b WHERE b.stock > 0")
    List<Barang> findByStockGreaterThanZero();
    
    @Query("SELECT b FROM Barang b WHERE b.kategori.id = :kategoriId AND b.nama LIKE %:nama%")
    Page<Barang> findByKategoriIdAndNamaContainingIgnoreCase(
        @Param("kategoriId") Long kategoriId, 
        @Param("nama") String nama, 
        Pageable pageable
    );
    
    @Query("SELECT b FROM Barang b WHERE b.nama LIKE %:nama%")
    Page<Barang> findByNamaContainingIgnoreCase(@Param("nama") String nama, Pageable pageable);
    
    @Query("SELECT COUNT(b) FROM Barang b WHERE b.stock <= 10")
    long countLowStockItems();
    
    List<Barang> findByStockGreaterThan(Integer stock);
    
    List<Barang> findByStockLessThanEqual(Integer stock);
    
    long countByStockGreaterThan(Integer stock);
    
    long countByStockLessThanEqual(Integer stock);
    
    long countByStockBetween(Integer minStock, Integer maxStock);
    
    long countByStock(Integer stock);
    
    List<Barang> findAllByOrderByNamaAsc();
}