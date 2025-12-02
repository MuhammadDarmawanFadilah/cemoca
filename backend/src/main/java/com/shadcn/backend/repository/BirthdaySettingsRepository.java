package com.shadcn.backend.repository;

import com.shadcn.backend.entity.BirthdaySettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BirthdaySettingsRepository extends JpaRepository<BirthdaySettings, Long> {
    
    @Query("SELECT bs FROM BirthdaySettings bs ORDER BY bs.updatedAt DESC LIMIT 1")
    Optional<BirthdaySettings> findLatestSettings();
    
    @Query("SELECT bs FROM BirthdaySettings bs WHERE bs.enabled = true ORDER BY bs.updatedAt DESC LIMIT 1")
    Optional<BirthdaySettings> findActiveSettings();
}
