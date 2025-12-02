package com.shadcn.backend.repository;

import com.shadcn.backend.entity.MidtransConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MidtransConfigRepository extends JpaRepository<MidtransConfig, Long> {
    
    @Query("SELECT m FROM MidtransConfig m WHERE m.isActive = true ORDER BY m.updatedAt DESC")
    Optional<MidtransConfig> findActiveConfig();
    
    @Query("SELECT m FROM MidtransConfig m WHERE m.isActive = true AND m.isProduction = ?1 ORDER BY m.updatedAt DESC")
    Optional<MidtransConfig> findActiveConfigByEnvironment(Boolean isProduction);
}