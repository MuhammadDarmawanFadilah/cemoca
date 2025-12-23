package com.shadcn.backend.repository;

import com.shadcn.backend.model.SchedulerLogEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SchedulerLogRepository extends JpaRepository<SchedulerLogEntry, Long> {
}
