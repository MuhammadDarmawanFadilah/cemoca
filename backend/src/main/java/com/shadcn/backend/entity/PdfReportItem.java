package com.shadcn.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "pdf_report_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PdfReportItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pdf_report_id", nullable = false)
    private PdfReport pdfReport;

    @Column(name = "item_row_number")
    private Integer rowNumber;
    private String name;
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String personalizedMessage;

    private String status; // PENDING, PROCESSING, DONE, FAILED
    
    @Column(columnDefinition = "TEXT")
    private String pdfUrl; // Generated PDF URL
    
    private String pdfFilename; // Stored PDF filename
    
    private LocalDateTime pdfGeneratedAt; // Time when PDF was generated

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    // WhatsApp Blast fields
    private String waStatus; // PENDING, SENT, FAILED
    private String waMessageId;
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
