package com.shadcn.backend.repository;

import com.shadcn.backend.model.WorkExperience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface WorkExperienceRepository extends JpaRepository<WorkExperience, Long> {
    
    List<WorkExperience> findByBiografi_BiografiId(Long biografiId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM WorkExperience w WHERE w.biografi.biografiId = :biografiId")
    void deleteByBiografi_BiografiId(@Param("biografiId") Long biografiId);
}
