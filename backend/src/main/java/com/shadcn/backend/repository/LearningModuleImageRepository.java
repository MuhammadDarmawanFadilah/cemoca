package com.shadcn.backend.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.shadcn.backend.model.LearningModuleImage;

public interface LearningModuleImageRepository extends JpaRepository<LearningModuleImage, Long> {
    boolean existsByCode(String code);

        Optional<LearningModuleImage> findByCodeIgnoreCase(String code);

    @Query("select i from LearningModuleImage i where coalesce(i.shareScope, 'GENERAL') = 'GENERAL'")
    Page<LearningModuleImage> findGeneralVisible(Pageable pageable);

    @Query("select i from LearningModuleImage i where coalesce(i.shareScope, 'GENERAL') = 'GENERAL' or (coalesce(i.shareScope, 'GENERAL') = 'COMPANY_ONLY' and i.createdByCompanyName = :companyName)")
    Page<LearningModuleImage> findVisibleForCompany(@Param("companyName") String companyName, Pageable pageable);

    @Query("select i from LearningModuleImage i where i.id = :id and (coalesce(i.shareScope, 'GENERAL') = 'GENERAL' or (coalesce(i.shareScope, 'GENERAL') = 'COMPANY_ONLY' and i.createdByCompanyName = :companyName))")
    Optional<LearningModuleImage> findVisibleByIdForCompany(@Param("id") Long id, @Param("companyName") String companyName);

    @Query(value = "SELECT * FROM learning_module_images i WHERE " +
            "(COALESCE(i.share_scope, 'GENERAL') = 'GENERAL' OR (COALESCE(i.share_scope, 'GENERAL') = 'COMPANY_ONLY' AND i.created_by_company_name = :requesterCompanyName)) " +
            "AND (:title IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
            "AND (:duration IS NULL OR i.duration = :duration) " +
            "AND (:creator IS NULL OR LOWER(i.created_by_company_name) LIKE LOWER(CONCAT('%', :creator, '%'))) " +
            "AND (:audienceRegex IS NULL OR i.intended_audience REGEXP :audienceRegex) " +
            "AND (:contentTypeRegex IS NULL OR i.content_types REGEXP :contentTypeRegex)",
            countQuery = "SELECT count(*) FROM learning_module_images i WHERE " +
                    "(COALESCE(i.share_scope, 'GENERAL') = 'GENERAL' OR (COALESCE(i.share_scope, 'GENERAL') = 'COMPANY_ONLY' AND i.created_by_company_name = :requesterCompanyName)) " +
                    "AND (:title IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
                    "AND (:duration IS NULL OR i.duration = :duration) " +
                    "AND (:creator IS NULL OR LOWER(i.created_by_company_name) LIKE LOWER(CONCAT('%', :creator, '%'))) " +
                    "AND (:audienceRegex IS NULL OR i.intended_audience REGEXP :audienceRegex) " +
                    "AND (:contentTypeRegex IS NULL OR i.content_types REGEXP :contentTypeRegex)",
            nativeQuery = true)
    Page<LearningModuleImage> search(
            @Param("requesterCompanyName") String requesterCompanyName,
            @Param("title") String title,
            @Param("duration") String duration,
            @Param("creator") String creator,
            @Param("audienceRegex") String audienceRegex,
            @Param("contentTypeRegex") String contentTypeRegex,
            Pageable pageable
    );

    @Query(value = "SELECT * FROM learning_module_images i WHERE " +
            "COALESCE(i.share_scope, 'GENERAL') = 'GENERAL' " +
            "AND (:title IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
            "AND (:duration IS NULL OR i.duration = :duration) " +
            "AND (:creator IS NULL OR LOWER(i.created_by_company_name) LIKE LOWER(CONCAT('%', :creator, '%'))) " +
            "AND (:audienceRegex IS NULL OR i.intended_audience REGEXP :audienceRegex) " +
            "AND (:contentTypeRegex IS NULL OR i.content_types REGEXP :contentTypeRegex)",
            countQuery = "SELECT count(*) FROM learning_module_images i WHERE " +
                    "COALESCE(i.share_scope, 'GENERAL') = 'GENERAL' " +
                    "AND (:title IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
                    "AND (:duration IS NULL OR i.duration = :duration) " +
                    "AND (:creator IS NULL OR LOWER(i.created_by_company_name) LIKE LOWER(CONCAT('%', :creator, '%'))) " +
                    "AND (:audienceRegex IS NULL OR i.intended_audience REGEXP :audienceRegex) " +
                    "AND (:contentTypeRegex IS NULL OR i.content_types REGEXP :contentTypeRegex)",
            nativeQuery = true)
    Page<LearningModuleImage> searchGeneral(
            @Param("title") String title,
            @Param("duration") String duration,
            @Param("creator") String creator,
            @Param("audienceRegex") String audienceRegex,
            @Param("contentTypeRegex") String contentTypeRegex,
            Pageable pageable
    );
}
