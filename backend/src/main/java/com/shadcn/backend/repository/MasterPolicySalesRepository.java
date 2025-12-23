package com.shadcn.backend.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.shadcn.backend.model.MasterPolicySales;

@Repository
public interface MasterPolicySalesRepository extends JpaRepository<MasterPolicySales, Long> {

        interface AgentLastPolicyAt {
                String getAgentCode();
                LocalDateTime getLastPolicyAt();
        }

        interface AgentPolicyCount {
                String getAgentCode();
                long getPolicyCount();
        }

        long countByCompanyCode(String companyCode);

    Optional<MasterPolicySales> findByCompanyCodeAndAgentCodeIgnoreCase(String companyCode, String agentCode);

        boolean existsByCompanyCodeAndAgentCodeIgnoreCaseAndCreatedAt(String companyCode, String agentCode, LocalDateTime createdAt);

    @Transactional
    long deleteByCompanyCode(String companyCode);

    @Query("select p.agentCode as agentCode, max(p.createdAt) as lastPolicyAt " +
            "from MasterPolicySales p " +
            "where p.companyCode = :companyCode " +
            "group by p.agentCode " +
            "having max(p.createdAt) >= :startAt and max(p.createdAt) < :endAt")
    List<AgentLastPolicyAt> findAgentLastPolicyAtBetween(
            @Param("companyCode") String companyCode,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt
    );

    @Query("select p.agentCode as agentCode, count(p.id) as policyCount " +
            "from MasterPolicySales p " +
            "where p.companyCode = :companyCode " +
            "and p.createdAt >= :startAt and p.createdAt < :endAt " +
            "group by p.agentCode " +
            "having count(p.id) >= :minCount")
    List<AgentPolicyCount> findAgentPolicyCountBetween(
            @Param("companyCode") String companyCode,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt,
            @Param("minCount") long minCount
    );

    @Query("SELECT p FROM MasterPolicySales p WHERE " +
            "p.companyCode = :companyCode AND (" +
            "(:search IS NULL OR " +
            "LOWER(p.agentCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
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
            "(:createdBy IS NULL OR LOWER(p.createdBy) LIKE LOWER(CONCAT('%', :createdBy, '%'))) ")
    Page<MasterPolicySales> findWithColumnFilters(
            @Param("companyCode") String companyCode,
            @Param("agentCode") String agentCode,
            @Param("createdBy") String createdBy,
            Pageable pageable
    );
}
