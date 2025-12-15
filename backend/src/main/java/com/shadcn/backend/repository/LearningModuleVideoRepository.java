package com.shadcn.backend.repository;

import com.shadcn.backend.model.LearningModuleVideo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface LearningModuleVideoRepository extends JpaRepository<LearningModuleVideo, Long> {
    boolean existsByCode(String code);

    @Query("select v from LearningModuleVideo v where coalesce(v.shareScope, 'GENERAL') = 'GENERAL'")
    Page<LearningModuleVideo> findGeneralVisible(Pageable pageable);

    @Query("select v from LearningModuleVideo v where coalesce(v.shareScope, 'GENERAL') = 'GENERAL' or (coalesce(v.shareScope, 'GENERAL') = 'COMPANY_ONLY' and v.createdByCompanyName = :companyName)")
    Page<LearningModuleVideo> findVisibleForCompany(@Param("companyName") String companyName, Pageable pageable);

    @Query("select v from LearningModuleVideo v where v.id = :id and (coalesce(v.shareScope, 'GENERAL') = 'GENERAL' or (coalesce(v.shareScope, 'GENERAL') = 'COMPANY_ONLY' and v.createdByCompanyName = :companyName))")
    Optional<LearningModuleVideo> findVisibleByIdForCompany(@Param("id") Long id, @Param("companyName") String companyName);

    @Query(value = "SELECT * FROM learning_module_videos v WHERE " +
            "(COALESCE(v.share_scope, 'GENERAL') = 'GENERAL' OR (COALESCE(v.share_scope, 'GENERAL') = 'COMPANY_ONLY' AND v.created_by_company_name = :requesterCompanyName)) " +
            "AND (:title IS NULL OR LOWER(v.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
            "AND (:duration IS NULL OR v.duration = :duration) " +
            "AND (:creator IS NULL OR LOWER(v.created_by_company_name) LIKE LOWER(CONCAT('%', :creator, '%'))) " +
            "AND (:audienceRegex IS NULL OR v.intended_audience REGEXP :audienceRegex) " +
            "AND (:contentTypeRegex IS NULL OR v.content_types REGEXP :contentTypeRegex)",
            countQuery = "SELECT count(*) FROM learning_module_videos v WHERE " +
                    "(COALESCE(v.share_scope, 'GENERAL') = 'GENERAL' OR (COALESCE(v.share_scope, 'GENERAL') = 'COMPANY_ONLY' AND v.created_by_company_name = :requesterCompanyName)) " +
                    "AND (:title IS NULL OR LOWER(v.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
                    "AND (:duration IS NULL OR v.duration = :duration) " +
                    "AND (:creator IS NULL OR LOWER(v.created_by_company_name) LIKE LOWER(CONCAT('%', :creator, '%'))) " +
                    "AND (:audienceRegex IS NULL OR v.intended_audience REGEXP :audienceRegex) " +
                    "AND (:contentTypeRegex IS NULL OR v.content_types REGEXP :contentTypeRegex)",
            nativeQuery = true)
    Page<LearningModuleVideo> search(
            @Param("requesterCompanyName") String requesterCompanyName,
            @Param("title") String title,
            @Param("duration") String duration,
            @Param("creator") String creator,
            @Param("audienceRegex") String audienceRegex,
            @Param("contentTypeRegex") String contentTypeRegex,
            Pageable pageable
    );

    @Query(value = "SELECT * FROM learning_module_videos v WHERE " +
            "COALESCE(v.share_scope, 'GENERAL') = 'GENERAL' " +
            "AND (:title IS NULL OR LOWER(v.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
            "AND (:duration IS NULL OR v.duration = :duration) " +
            "AND (:creator IS NULL OR LOWER(v.created_by_company_name) LIKE LOWER(CONCAT('%', :creator, '%'))) " +
            "AND (:audienceRegex IS NULL OR v.intended_audience REGEXP :audienceRegex) " +
            "AND (:contentTypeRegex IS NULL OR v.content_types REGEXP :contentTypeRegex)",
            countQuery = "SELECT count(*) FROM learning_module_videos v WHERE " +
                    "COALESCE(v.share_scope, 'GENERAL') = 'GENERAL' " +
                    "AND (:title IS NULL OR LOWER(v.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
                    "AND (:duration IS NULL OR v.duration = :duration) " +
                    "AND (:creator IS NULL OR LOWER(v.created_by_company_name) LIKE LOWER(CONCAT('%', :creator, '%'))) " +
                    "AND (:audienceRegex IS NULL OR v.intended_audience REGEXP :audienceRegex) " +
                    "AND (:contentTypeRegex IS NULL OR v.content_types REGEXP :contentTypeRegex)",
            nativeQuery = true)
    Page<LearningModuleVideo> searchGeneral(
            @Param("title") String title,
            @Param("duration") String duration,
            @Param("creator") String creator,
            @Param("audienceRegex") String audienceRegex,
            @Param("contentTypeRegex") String contentTypeRegex,
            Pageable pageable
    );
}
