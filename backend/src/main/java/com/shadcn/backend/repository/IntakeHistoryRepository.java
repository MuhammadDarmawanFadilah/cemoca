package com.shadcn.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.shadcn.backend.model.IntakeHistory;

@Repository
public interface IntakeHistoryRepository extends JpaRepository<IntakeHistory, Long> {
    
    Page<IntakeHistory> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    List<IntakeHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    Optional<IntakeHistory> findByUserIdAndIntakeDate(Long userId, LocalDate intakeDate);
    
    boolean existsByUserIdAndIntakeDate(Long userId, LocalDate intakeDate);
    
    @Query("SELECT ih FROM IntakeHistory ih WHERE ih.user.id = :userId AND ih.intakeDate BETWEEN :startDate AND :endDate ORDER BY ih.intakeDate DESC")
    List<IntakeHistory> findByUserIdAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT ih FROM IntakeHistory ih WHERE ih.intakeDate = :date ORDER BY ih.createdAt DESC")
    List<IntakeHistory> findByIntakeDate(@Param("date") LocalDate date);
}
