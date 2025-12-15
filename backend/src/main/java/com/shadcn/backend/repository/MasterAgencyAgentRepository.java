package com.shadcn.backend.repository;

import com.shadcn.backend.model.MasterAgencyAgent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface MasterAgencyAgentRepository extends JpaRepository<MasterAgencyAgent, Long> {

        Optional<MasterAgencyAgent> findByCompanyCodeAndAgentCodeIgnoreCase(String companyCode, String agentCode);

        boolean existsByCompanyCodeAndAgentCodeIgnoreCase(String companyCode, String agentCode);

        boolean existsByCompanyCodeAndAgentCodeIgnoreCaseAndIdNot(String companyCode, String agentCode, Long id);

        @Transactional
        long deleteByCompanyCode(String companyCode);

    @Query("SELECT a FROM MasterAgencyAgent a WHERE " +
            "a.companyCode = :companyCode AND (" +
            "(:search IS NULL OR " +
            "LOWER(a.agentCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(a.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(a.phoneNo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(a.rankCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(a.rankTitle) LIKE LOWER(CONCAT('%', :search, '%'))" +
            ") AND " +
            "(:isActive IS NULL OR a.isActive = :isActive))")
    Page<MasterAgencyAgent> findWithFilters(
            @Param("companyCode") String companyCode,
            @Param("search") String search,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );

    @Query("SELECT a FROM MasterAgencyAgent a WHERE " +
            "a.companyCode = :companyCode AND " +
            "(:fullName IS NULL OR LOWER(a.fullName) LIKE LOWER(CONCAT('%', :fullName, '%'))) AND " +
            "(:phoneNo IS NULL OR LOWER(a.phoneNo) LIKE LOWER(CONCAT('%', :phoneNo, '%'))) AND " +
            "(:rankCode IS NULL OR LOWER(a.rankCode) LIKE LOWER(CONCAT('%', :rankCode, '%'))) AND " +
            "(:createdBy IS NULL OR LOWER(a.createdBy) LIKE LOWER(CONCAT('%', :createdBy, '%'))) AND " +
            "(:isActive IS NULL OR a.isActive = :isActive)")
    Page<MasterAgencyAgent> findWithColumnFilters(
            @Param("companyCode") String companyCode,
            @Param("fullName") String fullName,
            @Param("phoneNo") String phoneNo,
            @Param("rankCode") String rankCode,
            @Param("createdBy") String createdBy,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );
}
