package com.shadcn.backend.repository;

import com.shadcn.backend.model.CertificateTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CertificateTemplateRepository extends JpaRepository<CertificateTemplate, Long> {
    
    Optional<CertificateTemplate> findByTemplateCode(String templateCode);
    
    List<CertificateTemplate> findByIsActiveTrueOrderByTemplateNameAsc();
    
    @Query("SELECT ct FROM CertificateTemplate ct WHERE " +
           "(:search IS NULL OR LOWER(ct.templateName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(ct.templateCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(ct.description) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:isActive IS NULL OR ct.isActive = :isActive)")
    Page<CertificateTemplate> findWithFilters(@Param("search") String search, 
                                              @Param("isActive") Boolean isActive, 
                                              Pageable pageable);
    
    boolean existsByTemplateCode(String templateCode);
    
    boolean existsByTemplateCodeAndIdNot(String templateCode, Long id);
}
