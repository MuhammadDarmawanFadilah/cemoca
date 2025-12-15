package com.shadcn.backend.repository;

import com.shadcn.backend.model.MasterPolicySales;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface MasterPolicySalesRepository extends JpaRepository<MasterPolicySales, Long> {

    Optional<MasterPolicySales> findByCompanyCodeAndAgentCodeIgnoreCaseAndPolicyCodeIgnoreCase(
            String companyCode,
            String agentCode,
            String policyCode
    );

    boolean existsByCompanyCodeAndAgentCodeIgnoreCaseAndPolicyCodeIgnoreCase(
            String companyCode,
            String agentCode,
            String policyCode
    );

    boolean existsByCompanyCodeAndAgentCodeIgnoreCaseAndPolicyCodeIgnoreCaseAndIdNot(
            String companyCode,
            String agentCode,
            String policyCode,
            Long id
    );

    @Transactional
    long deleteByCompanyCode(String companyCode);

    @Query("SELECT p FROM MasterPolicySales p WHERE " +
            "p.companyCode = :companyCode AND (" +
            "(:search IS NULL OR " +
            "LOWER(p.agentCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.policyCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.createdBy) LIKE LOWER(CONCAT('%', :search, '%'))" +
            "))")
    Page<MasterPolicySales> findWithFilters(
            @Param("companyCode") String companyCode,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT p FROM MasterPolicySales p WHERE " +
            "p.companyCode = :companyCode AND " +
            "(:agentCode IS NULL OR LOWER(p.agentCode) LIKE LOWER(CONCAT('%', :agentCode, '%'))) AND " +
            "(:policyCode IS NULL OR LOWER(p.policyCode) LIKE LOWER(CONCAT('%', :policyCode, '%'))) AND " +
            "(:createdBy IS NULL OR LOWER(p.createdBy) LIKE LOWER(CONCAT('%', :createdBy, '%'))) ")
    Page<MasterPolicySales> findWithColumnFilters(
            @Param("companyCode") String companyCode,
            @Param("agentCode") String agentCode,
            @Param("policyCode") String policyCode,
            @Param("createdBy") String createdBy,
            Pageable pageable
    );
}
