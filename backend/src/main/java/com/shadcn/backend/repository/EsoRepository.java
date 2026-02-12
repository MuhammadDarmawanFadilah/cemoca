package com.shadcn.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.shadcn.backend.model.Eso;

@Repository
public interface EsoRepository extends JpaRepository<Eso, Long> {
    
    Page<Eso> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    Page<Eso> findByTitleContainingIgnoreCaseOrderByCreatedAtDesc(String title, Pageable pageable);
}
