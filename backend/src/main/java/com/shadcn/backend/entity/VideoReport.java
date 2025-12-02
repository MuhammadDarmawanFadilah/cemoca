package com.shadcn.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.shadcn.backend.model.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "video_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VideoReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String reportName;

    @Column(columnDefinition = "TEXT")
    private String messageTemplate;
    
    @Column(columnDefinition = "TEXT")
    private String waMessageTemplate; // WhatsApp message template with :linkvideo parameter

    @Column(nullable = false)
    private String status; // PENDING, PROCESSING, COMPLETED, FAILED

    private Integer totalRecords;
    private Integer processedRecords;
    private Integer successCount;
    private Integer failedCount;
    
    // WhatsApp blast stats
    private Integer waSentCount;
    private Integer waFailedCount;
    private Integer waAutoRetryCount; // Track auto retry attempts for scheduler

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "videoReport", fetch = FetchType.LAZY)
    @JsonIgnore
    private java.util.List<VideoReportItem> items;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
        if (processedRecords == null) {
            processedRecords = 0;
        }
        if (successCount == null) {
            successCount = 0;
        }
        if (failedCount == null) {
            failedCount = 0;
        }
        if (waSentCount == null) {
            waSentCount = 0;
        }
        if (waFailedCount == null) {
            waFailedCount = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
