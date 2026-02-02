package com.shadcn.backend.repository;

import com.shadcn.backend.model.LearningVideoTextBundle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LearningVideoTextBundleRepository extends JpaRepository<LearningVideoTextBundle, Long> {
    Optional<LearningVideoTextBundle> findByCode(String code);
    boolean existsByCode(String code);
    Page<LearningVideoTextBundle> findByCodeContainingIgnoreCase(String code, Pageable pageable);
}
