package com.shadcn.backend.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "learning_schedule_histories",
        indexes = {
                @Index(name = "idx_learning_schedule_histories_company_code", columnList = "company_code"),
                @Index(name = "idx_learning_schedule_histories_scheduler_type", columnList = "scheduler_type"),
                @Index(name = "idx_learning_schedule_histories_started_at", columnList = "started_at"),
                @Index(name = "idx_learning_schedule_histories_status", columnList = "status")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearningScheduleHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "config_id")
    private LearningScheduleConfig config;

    @Column(name = "company_code", length = 50, nullable = false)
    private String companyCode;

    @Column(name = "scheduler_type", length = 80, nullable = false)
    private String schedulerType;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "status", length = 24, nullable = false)
    private String status;

    @Column(name = "total_targets")
    private Integer totalTargets;

    @Column(name = "sent_count")
    private Integer sentCount;

    @Column(name = "failed_count")
    private Integer failedCount;

    @Column(name = "skipped_count")
    private Integer skippedCount;

    @Column(name = "error_message", columnDefinition = "LONGTEXT")
    private String errorMessage;

    @OneToMany(mappedBy = "history", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LearningScheduleHistoryItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) {
            startedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "PROCESSING";
        }
        createdAt = LocalDateTime.now();
    }
}
