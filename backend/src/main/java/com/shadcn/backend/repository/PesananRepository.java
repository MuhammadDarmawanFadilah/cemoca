package com.shadcn.backend.repository;

import com.shadcn.backend.model.Pesanan;
import com.shadcn.backend.model.Member;
import com.shadcn.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PesananRepository extends JpaRepository<Pesanan, Long>, JpaSpecificationExecutor<Pesanan> {
    
    List<Pesanan> findByMember(Member member);
    
    List<Pesanan> findByKaryawan(User karyawan);
    
    List<Pesanan> findByStatus(Pesanan.StatusPesanan status);
    
    @Query("SELECT p FROM Pesanan p WHERE p.tanggalPesanan BETWEEN :startDate AND :endDate")
    List<Pesanan> findByTanggalPesananBetween(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT p FROM Pesanan p WHERE p.status = :status ORDER BY p.tanggalPesanan DESC")
    Page<Pesanan> findByStatusOrderByTanggalPesananDesc(
        @Param("status") Pesanan.StatusPesanan status, 
        Pageable pageable
    );
    
    @Query("SELECT SUM(p.totalHarga) FROM Pesanan p WHERE p.status = 'COMPLETED' AND p.tanggalPesanan BETWEEN :startDate AND :endDate")
    BigDecimal getTotalRevenueByDateRange(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT COUNT(p) FROM Pesanan p WHERE DATE(p.tanggalPesanan) = CURRENT_DATE")
    long countTodayOrders();
    
    @Query("SELECT COUNT(p) FROM Pesanan p WHERE p.status = :status")
    long countByStatus(@Param("status") Pesanan.StatusPesanan status);
    
    @Query("SELECT COUNT(p) FROM Pesanan p WHERE p.status = 'COMPLETED' AND p.tanggalPesanan BETWEEN :startDate AND :endDate")
    long countCompletedOrdersByDateRange(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT COUNT(p) FROM Pesanan p WHERE p.tanggalPesanan BETWEEN :startDate AND :endDate")
    long countOrdersByDateRange(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate
    );
}