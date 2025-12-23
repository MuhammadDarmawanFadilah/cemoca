package com.shadcn.backend.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "learning_schedule_configs",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_learning_schedule_configs_company_type",
                        columnNames = {"company_code", "scheduler_type"}
                )
        },
        indexes = {
                @Index(name = "idx_learning_schedule_configs_company_code", columnList = "company_code"),
                @Index(name = "idx_learning_schedule_configs_scheduler_type", columnList = "scheduler_type"),
                @Index(name = "idx_learning_schedule_configs_active", columnList = "is_active"),
                @Index(name = "idx_learning_schedule_configs_last_triggered_at", columnList = "last_triggered_at")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearningScheduleConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_code", length = 50, nullable = false)
    private String companyCode;

    @Column(name = "scheduler_type", length = 80, nullable = false)
    private String schedulerType;

    @Column(name = "is_active", nullable = false)
    private Boolean active = false;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "hour_of_day", nullable = false)
    private Integer hourOfDay;

    @Column(name = "media_type", length = 16, nullable = false)
    private String mediaType;

    @Column(name = "learning_code", length = 160, nullable = false)
    private String learningCode;

    @Column(name = "video_learning_code_1", length = 160)
    private String videoLearningCode1;

    @Column(name = "video_learning_code_2", length = 160)
    private String videoLearningCode2;

    @Column(name = "video_learning_code_3", length = 160)
    private String videoLearningCode3;

    @Column(name = "video_learning_code_4", length = 160)
    private String videoLearningCode4;

    @Column(name = "video_text_template", columnDefinition = "LONGTEXT")
    private String videoTextTemplate;

    @Column(name = "video_text_template_1", columnDefinition = "LONGTEXT")
    private String videoTextTemplate1;

    @Column(name = "video_text_template_2", columnDefinition = "LONGTEXT")
    private String videoTextTemplate2;

    @Column(name = "video_text_template_3", columnDefinition = "LONGTEXT")
    private String videoTextTemplate3;

    @Column(name = "video_text_template_4", columnDefinition = "LONGTEXT")
    private String videoTextTemplate4;

    @Column(name = "wa_message_template", columnDefinition = "LONGTEXT")
    private String waMessageTemplate;

    @Column(name = "did_presenter_id", length = 120)
    private String didPresenterId;

    @Column(name = "did_presenter_name", length = 200)
    private String didPresenterName;

    @Column(name = "last_triggered_at")
    private LocalDateTime lastTriggeredAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (active == null) {
            active = false;
        }
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
