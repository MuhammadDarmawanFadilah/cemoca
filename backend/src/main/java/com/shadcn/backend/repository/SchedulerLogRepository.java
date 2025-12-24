package com.shadcn.backend.repository;

import com.shadcn.backend.model.SchedulerLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SchedulerLogRepository extends JpaRepository<SchedulerLog, Long> {
    
    Page<SchedulerLog> findAllByOrderByProcessedAtDesc(Pageable pageable);
    
    List<SchedulerLog> findByCompanyCodeOrderByProcessedAtDesc(String companyCode);
    
    List<SchedulerLog> findByStatusOrderByProcessedAtDesc(String status);
    
    List<SchedulerLog> findByProcessedAtAfterOrderByProcessedAtDesc(LocalDateTime date);
}
