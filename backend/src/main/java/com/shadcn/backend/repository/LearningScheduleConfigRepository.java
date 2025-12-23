package com.shadcn.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.shadcn.backend.model.LearningScheduleConfig;

public interface LearningScheduleConfigRepository extends JpaRepository<LearningScheduleConfig, Long> {

    List<LearningScheduleConfig> findByCompanyCodeOrderByUpdatedAtDesc(String companyCode);

    List<LearningScheduleConfig> findByActiveTrue();

    Optional<LearningScheduleConfig> findByCompanyCodeAndSchedulerType(String companyCode, String schedulerType);
}
