package com.shadcn.backend.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "learning_schedule_config_materials",
        indexes = {
                @Index(name = "idx_lscm_config_id", columnList = "config_id"),
                @Index(name = "idx_lscm_config_id_start", columnList = "config_id,start_date"),
                @Index(name = "idx_lscm_config_id_end", columnList = "config_id,end_date")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearningScheduleConfigMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "config_id", nullable = false)
    private LearningScheduleConfig config;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "learning_code", length = 160, nullable = false)
    private String learningCode;

    @Column(name = "video_text_template", columnDefinition = "LONGTEXT")
    private String videoTextTemplate;

    @Column(name = "video_learning_code_1", length = 160)
    private String videoLearningCode1;

    @Column(name = "video_learning_code_2", length = 160)
    private String videoLearningCode2;

    @Column(name = "video_learning_code_3", length = 160)
    private String videoLearningCode3;

    @Column(name = "video_learning_code_4", length = 160)
    private String videoLearningCode4;

    @Column(name = "video_text_template_1", columnDefinition = "LONGTEXT")
    private String videoTextTemplate1;

    @Column(name = "video_text_template_2", columnDefinition = "LONGTEXT")
    private String videoTextTemplate2;

    @Column(name = "video_text_template_3", columnDefinition = "LONGTEXT")
    private String videoTextTemplate3;

    @Column(name = "video_text_template_4", columnDefinition = "LONGTEXT")
    private String videoTextTemplate4;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
