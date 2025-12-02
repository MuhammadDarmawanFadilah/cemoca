package com.shadcn.backend.repository;

import com.shadcn.backend.model.PasswordResetToken;
import com.shadcn.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    Optional<PasswordResetToken> findByToken(String token);
    
    Optional<PasswordResetToken> findByTokenAndUsedFalse(String token);
    
    @Query("SELECT p FROM PasswordResetToken p WHERE p.user = :user AND p.used = false AND p.expiresAt > :now")
    Optional<PasswordResetToken> findValidTokenByUser(@Param("user") User user, @Param("now") LocalDateTime now);
    
    @Modifying
    @Query("DELETE FROM PasswordResetToken p WHERE p.expiresAt < :now")
    void deleteExpiredTokens(@Param("now") LocalDateTime now);
    
    @Modifying
    @Query("DELETE FROM PasswordResetToken p WHERE p.user = :user")
    void deleteByUser(@Param("user") User user);
    
    @Query("SELECT COUNT(p) FROM PasswordResetToken p WHERE p.user = :user AND p.createdAt > :since")
    Long countByUserAndCreatedAtAfter(@Param("user") User user, @Param("since") LocalDateTime since);
}