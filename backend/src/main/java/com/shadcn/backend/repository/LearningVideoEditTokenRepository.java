package com.shadcn.backend.repository;

import com.shadcn.backend.model.LearningVideoEditToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface LearningVideoEditTokenRepository extends JpaRepository<LearningVideoEditToken, Long> {
    Optional<LearningVideoEditToken> findByTokenAndExpiresAtAfterAndUsedFalse(String token, LocalDateTime now);
    Optional<LearningVideoEditToken> findByToken(String token);
}
