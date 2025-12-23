package com.shadcn.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.shadcn.backend.model.LearningScheduleHistory;

public interface LearningScheduleHistoryRepository extends JpaRepository<LearningScheduleHistory, Long> {

    Page<LearningScheduleHistory> findByCompanyCodeOrderByStartedAtDesc(String companyCode, Pageable pageable);
}
