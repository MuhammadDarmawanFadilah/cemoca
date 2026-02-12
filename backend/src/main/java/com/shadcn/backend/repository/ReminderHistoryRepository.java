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

import com.shadcn.backend.model.ReminderHistory;
import com.shadcn.backend.model.ReminderHistory.ReminderStatus;

@Repository
public interface ReminderHistoryRepository extends JpaRepository<ReminderHistory, Long> {
    
    Page<ReminderHistory> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    List<ReminderHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    Optional<ReminderHistory> findByUserIdAndReminderDate(Long userId, LocalDate reminderDate);
    
    List<ReminderHistory> findByReminderDateAndStatus(LocalDate reminderDate, ReminderStatus status);
    
    @Query("SELECT rh FROM ReminderHistory rh WHERE rh.reminderDate = :date ORDER BY rh.createdAt DESC")
    List<ReminderHistory> findByReminderDate(@Param("date") LocalDate date);
    
    @Query("SELECT rh FROM ReminderHistory rh WHERE rh.reminderDate BETWEEN :startDate AND :endDate ORDER BY rh.reminderDate DESC")
    List<ReminderHistory> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
