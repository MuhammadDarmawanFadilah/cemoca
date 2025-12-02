package com.shadcn.backend.repository;

import com.shadcn.backend.model.AcademicRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AcademicRecordRepository extends JpaRepository<AcademicRecord, Long> {
    
    // Find all academic records by biografi id
    List<AcademicRecord> findByBiografi_BiografiId(Long biografiId);
    
    // Delete all academic records by biografi id
    void deleteByBiografi_BiografiId(Long biografiId);
}
