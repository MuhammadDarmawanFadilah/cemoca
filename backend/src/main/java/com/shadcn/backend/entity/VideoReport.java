package com.shadcn.backend.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.shadcn.backend.model.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    private String videoLanguageCode;
    
    private Double voiceSpeed; // Voice speed control (0.5 - 1.5 recommended)
    private Double voicePitch; // Voice pitch control (-10 to 10 recommended)
    private Boolean enableCaption; // Enable video captions/subtitles
    
    @Column(columnDefinition = "TEXT")
    private String waMessageTemplate; // WhatsApp message template with :linkvideo parameter

    private Boolean useBackground;

    private String backgroundName;

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
        if (useBackground == null) {
            useBackground = false;
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
