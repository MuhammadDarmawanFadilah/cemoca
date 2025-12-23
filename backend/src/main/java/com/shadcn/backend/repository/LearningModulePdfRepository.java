package com.shadcn.backend.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.shadcn.backend.model.LearningModulePdf;

public interface LearningModulePdfRepository extends JpaRepository<LearningModulePdf, Long> {
    boolean existsByCode(String code);

        Optional<LearningModulePdf> findByCodeIgnoreCase(String code);

    @Query("select p from LearningModulePdf p where coalesce(p.shareScope, 'GENERAL') = 'GENERAL'")
    Page<LearningModulePdf> findGeneralVisible(Pageable pageable);

    @Query("select p from LearningModulePdf p where coalesce(p.shareScope, 'GENERAL') = 'GENERAL' or (coalesce(p.shareScope, 'GENERAL') = 'COMPANY_ONLY' and p.createdByCompanyName = :companyName)")
    Page<LearningModulePdf> findVisibleForCompany(@Param("companyName") String companyName, Pageable pageable);

    @Query("select p from LearningModulePdf p where p.id = :id and (coalesce(p.shareScope, 'GENERAL') = 'GENERAL' or (coalesce(p.shareScope, 'GENERAL') = 'COMPANY_ONLY' and p.createdByCompanyName = :companyName))")
    Optional<LearningModulePdf> findVisibleByIdForCompany(@Param("id") Long id, @Param("companyName") String companyName);

    @Query(value = "SELECT * FROM learning_module_pdfs p WHERE " +
            "(COALESCE(p.share_scope, 'GENERAL') = 'GENERAL' OR (COALESCE(p.share_scope, 'GENERAL') = 'COMPANY_ONLY' AND p.created_by_company_name = :requesterCompanyName)) " +
            "AND (:title IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
            "AND (:duration IS NULL OR p.duration = :duration) " +
            "AND (:creator IS NULL OR LOWER(p.created_by_company_name) LIKE LOWER(CONCAT('%', :creator, '%'))) " +
            "AND (:audienceRegex IS NULL OR p.intended_audience REGEXP :audienceRegex) " +
            "AND (:contentTypeRegex IS NULL OR p.content_types REGEXP :contentTypeRegex)",
            countQuery = "SELECT count(*) FROM learning_module_pdfs p WHERE " +
                    "(COALESCE(p.share_scope, 'GENERAL') = 'GENERAL' OR (COALESCE(p.share_scope, 'GENERAL') = 'COMPANY_ONLY' AND p.created_by_company_name = :requesterCompanyName)) " +
                    "AND (:title IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
                    "AND (:duration IS NULL OR p.duration = :duration) " +
                    "AND (:creator IS NULL OR LOWER(p.created_by_company_name) LIKE LOWER(CONCAT('%', :creator, '%'))) " +
                    "AND (:audienceRegex IS NULL OR p.intended_audience REGEXP :audienceRegex) " +
                    "AND (:contentTypeRegex IS NULL OR p.content_types REGEXP :contentTypeRegex)",
            nativeQuery = true)
    Page<LearningModulePdf> search(
            @Param("requesterCompanyName") String requesterCompanyName,
            @Param("title") String title,
            @Param("duration") String duration,
            @Param("creator") String creator,
            @Param("audienceRegex") String audienceRegex,
            @Param("contentTypeRegex") String contentTypeRegex,
            Pageable pageable
    );

    @Query(value = "SELECT * FROM learning_module_pdfs p WHERE " +
            "COALESCE(p.share_scope, 'GENERAL') = 'GENERAL' " +
            "AND (:title IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
            "AND (:duration IS NULL OR p.duration = :duration) " +
            "AND (:creator IS NULL OR LOWER(p.created_by_company_name) LIKE LOWER(CONCAT('%', :creator, '%'))) " +
            "AND (:audienceRegex IS NULL OR p.intended_audience REGEXP :audienceRegex) " +
            "AND (:contentTypeRegex IS NULL OR p.content_types REGEXP :contentTypeRegex)",
            countQuery = "SELECT count(*) FROM learning_module_pdfs p WHERE " +
                    "COALESCE(p.share_scope, 'GENERAL') = 'GENERAL' " +
                    "AND (:title IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
                    "AND (:duration IS NULL OR p.duration = :duration) " +
                    "AND (:creator IS NULL OR LOWER(p.created_by_company_name) LIKE LOWER(CONCAT('%', :creator, '%'))) " +
                    "AND (:audienceRegex IS NULL OR p.intended_audience REGEXP :audienceRegex) " +
                    "AND (:contentTypeRegex IS NULL OR p.content_types REGEXP :contentTypeRegex)",
            nativeQuery = true)
    Page<LearningModulePdf> searchGeneral(
            @Param("title") String title,
            @Param("duration") String duration,
            @Param("creator") String creator,
            @Param("audienceRegex") String audienceRegex,
            @Param("contentTypeRegex") String contentTypeRegex,
            Pageable pageable
    );
}
