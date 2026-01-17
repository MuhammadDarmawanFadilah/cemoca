package com.shadcn.backend.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "video_report_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VideoReportItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_report_id", nullable = false)
    private VideoReport videoReport;

    @Column(name = "item_row_number")
    private Integer rowNumber;
    private String name;
    private String phone;
    private String avatar;

    @Column(columnDefinition = "TEXT")
    private String personalizedMessage;

    @Column(name = "did_clip_id")
    private String providerVideoId;

    @Column(columnDefinition = "TEXT")
    private String providerTranslateId;

    private String status; // PENDING, PROCESSING, DONE, FAILED
    
    @Column(columnDefinition = "TEXT")
    private String videoUrl; // result_url from D-ID
    
    private LocalDateTime videoGeneratedAt; // Time when video was generated

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    // WhatsApp Blast fields
    private String waStatus; // PENDING, SENT, FAILED
    private String waMessageId;

    private String waBatchId;
    private LocalDateTime waBatchClaimedAt;

    @Column(columnDefinition = "TEXT")
    private String waErrorMessage;
    private LocalDateTime waSentAt;
    
    // Exclude from generation
    private Boolean excluded = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
        if (waStatus == null) {
            waStatus = "PENDING";
        }
        if (excluded == null) {
            excluded = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
