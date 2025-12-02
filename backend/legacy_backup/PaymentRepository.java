package com.shadcn.backend.repository;

import com.shadcn.backend.model.Payment;
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
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long>, JpaSpecificationExecutor<Payment> {
    
    Optional<Payment> findByPaymentId(String paymentId);
    
    List<Payment> findByUser(User user);
    
    List<Payment> findByUserId(Long userId);
    
    List<Payment> findByStatus(Payment.PaymentStatus status);
    
    List<Payment> findByStatusIn(List<Payment.PaymentStatus> statuses);
    
    List<Payment> findByMethod(Payment.PaymentMethod method);
    
    // Advanced filtering methods with pagination
    @Query("SELECT p FROM Payment p WHERE " +
           "(:email IS NULL OR LOWER(p.user.email) LIKE LOWER(CONCAT('%', :email, '%'))) AND " +
           "(:fullName IS NULL OR LOWER(p.user.fullName) LIKE LOWER(CONCAT('%', :fullName, '%'))) AND " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:method IS NULL OR p.method = :method) AND " +
           "(:description IS NULL OR LOWER(p.description) LIKE LOWER(CONCAT('%', :description, '%')))")
    Page<Payment> findPaymentsWithFilters(
            @Param("email") String email,
            @Param("fullName") String fullName,
            @Param("status") Payment.PaymentStatus status,
            @Param("method") Payment.PaymentMethod method,
            @Param("description") String description,
            Pageable pageable
    );
    
    @Query("SELECT p FROM Payment p WHERE p.amount BETWEEN :minAmount AND :maxAmount")
    List<Payment> findByAmountBetween(@Param("minAmount") BigDecimal minAmount, @Param("maxAmount") BigDecimal maxAmount);
    
    @Query("SELECT p FROM Payment p WHERE p.createdAt BETWEEN :startDate AND :endDate")
    List<Payment> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = :status")
    BigDecimal getTotalAmountByStatus(@Param("status") Payment.PaymentStatus status);
    
    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = :status")
    Long getCountByStatus(@Param("status") Payment.PaymentStatus status);
}
