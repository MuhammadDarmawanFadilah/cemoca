package com.shadcn.backend.repository;

import com.shadcn.backend.model.VideoBackground;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VideoBackgroundRepository extends JpaRepository<VideoBackground, Long> {

    Optional<VideoBackground> findFirstByNormalizedKey(String normalizedKey);

    boolean existsByNormalizedKey(String normalizedKey);

    Page<VideoBackground> findByBackgroundNameContainingIgnoreCaseOrNormalizedKeyContainingIgnoreCase(
            String backgroundName,
            String normalizedKey,
            Pageable pageable
    );
}
