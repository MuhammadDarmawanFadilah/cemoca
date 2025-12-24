package com.shadcn.backend.repository;

import com.shadcn.backend.model.SchedulerLogEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SchedulerLogEntryRepository extends JpaRepository<SchedulerLogEntry, Long> {
}
