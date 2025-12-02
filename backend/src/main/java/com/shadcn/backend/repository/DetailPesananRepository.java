package com.shadcn.backend.repository;

import com.shadcn.backend.model.DetailPesanan;
import com.shadcn.backend.model.Pesanan;
import com.shadcn.backend.model.Barang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface DetailPesananRepository extends JpaRepository<DetailPesanan, Long> {
    
    List<DetailPesanan> findByPesanan(Pesanan pesanan);
    
    List<DetailPesanan> findByBarang(Barang barang);
    
    @Query("SELECT dp FROM DetailPesanan dp WHERE dp.pesanan.id = :pesananId")
    List<DetailPesanan> findByPesananId(@Param("pesananId") Long pesananId);
    
    @Query("SELECT dp FROM DetailPesanan dp WHERE dp.barang.id = :barangId")
    List<DetailPesanan> findByBarangId(@Param("barangId") Long barangId);
    
    @Query("SELECT SUM(dp.jumlah) FROM DetailPesanan dp WHERE dp.barang = :barang")
    Integer getTotalJumlahByBarang(@Param("barang") Barang barang);
    
    @Query("SELECT SUM(dp.subtotal) FROM DetailPesanan dp WHERE dp.pesanan.id = :pesananId")
    BigDecimal getTotalSubtotalByPesananId(@Param("pesananId") Long pesananId);
    
    @Query("SELECT dp.barang.id, SUM(dp.jumlah) as totalTerjual " +
           "FROM DetailPesanan dp " +
           "WHERE dp.pesanan.status = 'COMPLETED' " +
           "GROUP BY dp.barang.id " +
           "ORDER BY totalTerjual DESC")
    List<Object[]> getTopSellingProducts();
}