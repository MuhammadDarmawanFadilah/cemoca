package com.shadcn.backend.repository;

import com.shadcn.backend.model.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, Long> {
    
    List<Achievement> findByBiografi_BiografiId(Long biografiId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Achievement a WHERE a.biografi.biografiId = :biografiId")
    void deleteByBiografi_BiografiId(@Param("biografiId") Long biografiId);
}
