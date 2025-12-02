package com.shadcn.backend.repository;

import com.shadcn.backend.model.SpesialisasiKedokteran;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpesialisasiKedokteranRepository extends JpaRepository<SpesialisasiKedokteran, Long> {
    
    void deleteByBiografi_BiografiId(Long biografiId);
}
