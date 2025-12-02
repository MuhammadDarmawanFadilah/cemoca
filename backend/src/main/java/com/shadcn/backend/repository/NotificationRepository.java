package com.shadcn.backend.repository;

import com.shadcn.backend.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    Page<Notification> findByStatusOrderByCreatedAtDesc(Notification.NotificationStatus status, Pageable pageable);
    
    Page<Notification> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    @Query("SELECT n FROM Notification n WHERE n.createdAt BETWEEN :startDate AND :endDate ORDER BY n.createdAt DESC")
    List<Notification> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    long countByStatus(Notification.NotificationStatus status);
}
